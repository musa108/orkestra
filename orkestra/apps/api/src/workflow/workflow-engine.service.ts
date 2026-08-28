import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { WorkflowState, WorkflowStepStatus, ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { DomainEvent } from '../events/event-types';
import { AgentRuntimeService } from '../agents/agent-runtime.service';
import { ToolAuthorizationService } from '../authz/tool-authorization.service';
import { MVP_WORKFLOW_STEPS, StepDefinition } from './workflow-definition';

const MAX_RETRIES = 3;

/**
 * Workflow Engine — deterministic execution core (ADR-005, ADR-013).
 * Owns all state transitions. Agents never modify workflow state directly
 * (ADR-014) — they return structured output which THIS service persists.
 */
@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger('WorkflowEngine');

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private agentRuntime: AgentRuntimeService,
    private toolAuth: ToolAuthorizationService,
  ) {}

  async start(productionId: string, brief: string | undefined, actorId: string, organizationId: string) {
    const production = await this.prisma.production.findUnique({ where: { id: productionId } });
    // Previously had no organization check — any authenticated user could
    // start a workflow against ANY production in ANY organization by id.
    if (!production || production.organizationId !== organizationId) {
      throw new NotFoundException('Production not found.');
    }

    const workflow = await this.prisma.workflow.create({
      data: {
        productionId,
        currentState: WorkflowState.CREATED,
      },
    });

    await this.prisma.$transaction(
      MVP_WORKFLOW_STEPS.map((step) =>
        this.prisma.workflowStep.create({
          data: {
            workflowId: workflow.id,
            name: step.name,
            assignedAgent: step.agent,
            status: WorkflowStepStatus.PENDING,
            input: { brief: brief ?? production.description ?? '' },
          },
        }),
      ),
    );

    await this.transitionTo(workflow.id, WorkflowState.RUNNING, actorId);
    await this.eventBus.publish(
      DomainEvent.WorkflowStarted,
      { productionId },
      { workflowId: workflow.id, productionId, actor: actorId },
    );

    // Execution proceeds asynchronously — the caller gets an immediate
    // handle back and watches progress over the WebSocket channel.
    this.runNextReadySteps(workflow.id).catch((err) =>
      this.logger.error(`Workflow ${workflow.id} execution error`, err),
    );

    return this.getWithSteps(workflow.id, organizationId);
  }

  /** Finds every step whose dependencies are satisfied and not yet run, executes them. */
  private async runNextReadySteps(workflowId: string): Promise<void> {
    const workflow = await this.prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow || workflow.currentState !== WorkflowState.RUNNING) return;

    const steps = await this.prisma.workflowStep.findMany({ where: { workflowId } });
    const completedNames = new Set(
      steps.filter((s) => s.status === WorkflowStepStatus.COMPLETED).map((s) => s.name),
    );

    const ready = MVP_WORKFLOW_STEPS.filter((def) => {
      const record = steps.find((s) => s.name === def.name);
      if (!record || record.status !== WorkflowStepStatus.PENDING) return false;
      return def.dependsOn.every((dep) => completedNames.has(dep));
    });

    if (ready.length === 0) {
      const allDone = steps.every((s) => s.status === WorkflowStepStatus.COMPLETED);
      const anyFailed = steps.some((s) => s.status === WorkflowStepStatus.FAILED);
      if (allDone) await this.complete(workflowId);
      if (anyFailed) await this.fail(workflowId, 'One or more steps failed permanently.');
      return; // otherwise: waiting on approval or in-flight steps
    }

    await Promise.all(ready.map((def) => this.executeStep(workflowId, def)));
    await this.runNextReadySteps(workflowId); // advance the graph further
  }

  private async executeStep(workflowId: string, def: StepDefinition, attempt = 1): Promise<void> {
    const workflowWithProduction = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { production: true },
    });
    if (!workflowWithProduction) return;

    const stepRecord = await this.prisma.workflowStep.findFirst({ where: { workflowId, name: def.name } });
    if (!stepRecord) return;

    // Approval-gated steps pause BEFORE agent execution. The step transitions
    // to PENDING (waiting) and the workflow halts until a human approves via
    // ApprovalsService. This intentionally skips the tool auth check — the
    // BUDGET agent lacks `budget.approve` by design; approval is a HUMAN
    // action, not an agent capability. After approval, resumeAfterApproval()
    // sets the step to COMPLETED and continues the graph.
    if (def.requiresApproval) {
      await this.requestApproval(workflowId, workflowWithProduction.productionId, def.name, stepRecord.id);
      return;
    }

    await this.prisma.workflowStep.update({
      where: { id: stepRecord.id },
      data: { status: WorkflowStepStatus.RUNNING, startedAt: new Date() },
    });
    await this.eventBus.publish(
      DomainEvent.WorkflowStepStarted,
      { step: def.name, agent: def.agent },
      { workflowId, productionId: workflowWithProduction.productionId },
    );

    // Enforcement point: if this step maps to a registered tool, the agent's
    // capability is checked before it runs. A denial fails the step outright
    // rather than retrying — a capability gap isn't a transient failure.
    if (def.tool) {
      try {
        await this.toolAuth.authorize(def.agent, def.tool, {
          organizationId: workflowWithProduction.production.organizationId,
          workflowId,
        });
      } catch (err) {
        await this.prisma.workflowStep.update({
          where: { id: stepRecord.id },
          data: { status: WorkflowStepStatus.FAILED },
        });
        await this.eventBus.publish(
          DomainEvent.WorkflowFailed,
          { step: def.name, error: (err as Error).message },
          { workflowId, productionId: workflowWithProduction.productionId },
        );
        return;
      }
    }

    try {
      const result = await this.agentRuntime.run(def.agent, {
        workflowId,
        productionId: workflowWithProduction.productionId,
        input: (stepRecord.input as Record<string, unknown>) ?? {},
      });

      await this.prisma.workflowStep.update({
        where: { id: stepRecord.id },
        data: {
          status: WorkflowStepStatus.COMPLETED,
          output: result.structuredData as any,
          completedAt: new Date(),
        },
      });
      await this.eventBus.publish(
        DomainEvent.WorkflowStepCompleted,
        { step: def.name, agent: def.agent, confidence: result.confidence },
        { workflowId, productionId: workflowWithProduction.productionId },
      );
    } catch (err) {
      if (attempt <= MAX_RETRIES) {
        this.logger.warn(`Retrying step ${def.name} (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
        return this.executeStep(workflowId, def, attempt + 1);
      }
      await this.prisma.workflowStep.update({
        where: { id: stepRecord.id },
        data: { status: WorkflowStepStatus.FAILED, retryCount: attempt },
      });
      await this.eventBus.publish(
        DomainEvent.WorkflowFailed,
        { step: def.name, error: (err as Error).message },
        { workflowId, productionId: workflowWithProduction.productionId },
      );
    }
  }

  private async requestApproval(workflowId: string, productionId: string, stepName: string, stepId?: string) {
    // Mark the step as PENDING (waiting for human sign-off) so the graph
    // knows to wait and won't treat it as failed.
    if (stepId) {
      await this.prisma.workflowStep.update({
        where: { id: stepId },
        data: { status: WorkflowStepStatus.PENDING },
      });
    }

    await this.transitionTo(workflowId, WorkflowState.WAITING_APPROVAL);

    const workflow = await this.prisma.workflow.findUnique({ where: { id: workflowId }, include: { production: true } });
    const requestedById = workflow!.production.createdById;

    // Fetch upstream risk assessment output if available
    const riskStep = await this.prisma.workflowStep.findFirst({
      where: { workflowId, name: 'risk-assessment' },
    });
    const riskOutput = (riskStep?.output as any) ?? {};
    const rawRisk = (riskOutput.riskLevel ?? 'HIGH').toUpperCase();
    const riskLevel = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(rawRisk) ? rawRisk : 'HIGH';
    const comments = riskOutput.summary ?? `Approval required for step: ${stepName}`;

    const approval = await this.prisma.approval.create({
      data: {
        workflowId,
        productionId,
        requestedById,
        requestedByType: 'AGENT',
        action: stepName || 'budget-approval',
        riskLevel: riskLevel as any,
        proposedChanges: {
          ...riskOutput,
          stepName,
        },
        status: ApprovalStatus.PENDING,
        comments,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h default expiry
      },
    });

    await this.eventBus.publish(
      DomainEvent.ApprovalRequested,
      { approvalId: approval.id, step: stepName, riskLevel, summary: comments },
      { workflowId, productionId, organizationId: workflow!.production.organizationId },
    );
  }

  /** Called by ApprovalsService once a human approves — resumes execution.
   *  The approval-gated step is marked COMPLETED here, then the graph continues. */
  async resumeAfterApproval(workflowId: string, approvedStepName?: string) {
    let step = approvedStepName
      ? await this.prisma.workflowStep.findFirst({
          where: { workflowId, name: approvedStepName },
        })
      : null;

    if (!step) {
      // Fallback: find any step in this workflow that requires approval and is PENDING
      const approvalStepNames = MVP_WORKFLOW_STEPS.filter((s) => s.requiresApproval).map((s) => s.name);
      step = await this.prisma.workflowStep.findFirst({
        where: { workflowId, name: { in: approvalStepNames }, status: WorkflowStepStatus.PENDING },
      });
    }

    if (step) {
      await this.prisma.workflowStep.update({
        where: { id: step.id },
        data: {
          status: WorkflowStepStatus.COMPLETED,
          completedAt: new Date(),
          output: { approvedByHuman: true, stepName: step.name },
        },
      });
    }

    await this.transitionTo(workflowId, WorkflowState.RUNNING);
    await this.runNextReadySteps(workflowId);
  }

  /** Called by ApprovalsService when an approval request is rejected by human executive. */
  async handleApprovalRejection(workflowId: string, rejectedStepName?: string) {
    let step = rejectedStepName
      ? await this.prisma.workflowStep.findFirst({
          where: { workflowId, name: rejectedStepName },
        })
      : null;

    if (!step) {
      const approvalStepNames = MVP_WORKFLOW_STEPS.filter((s) => s.requiresApproval).map((s) => s.name);
      step = await this.prisma.workflowStep.findFirst({
        where: { workflowId, name: { in: approvalStepNames }, status: WorkflowStepStatus.PENDING },
      });
    }

    if (step) {
      await this.prisma.workflowStep.update({
        where: { id: step.id },
        data: {
          status: WorkflowStepStatus.FAILED,
          completedAt: new Date(),
          output: { approvedByHuman: false, error: 'Approval rejected by human executive' },
        },
      });
    }

    await this.fail(workflowId, 'Workflow halted: human approval was rejected.');
  }

  async pause(workflowId: string, organizationId: string) {
    await this.assertOwnership(workflowId, organizationId);
    return this.transitionTo(workflowId, WorkflowState.WAITING_APPROVAL);
  }

  async resume(workflowId: string, organizationId: string) {
    await this.assertOwnership(workflowId, organizationId);
    await this.transitionTo(workflowId, WorkflowState.RUNNING);
    this.runNextReadySteps(workflowId).catch((err) => this.logger.error(err));
    return this.getWithSteps(workflowId, organizationId);
  }

  async cancel(workflowId: string, organizationId: string) {
    await this.assertOwnership(workflowId, organizationId);
    return this.fail(workflowId, 'Cancelled by user.');
  }

  private async complete(workflowId: string) {
    const workflow = await this.transitionTo(workflowId, WorkflowState.COMPLETED);
    await this.prisma.workflow.update({ where: { id: workflowId }, data: { completedAt: new Date() } });
    await this.eventBus.publish(
      DomainEvent.WorkflowCompleted,
      {},
      { workflowId, productionId: workflow.productionId },
    );
    return workflow;
  }

  private async fail(workflowId: string, reason: string) {
    const workflow = await this.transitionTo(workflowId, WorkflowState.FAILED);
    await this.eventBus.publish(
      DomainEvent.WorkflowFailed,
      { reason },
      { workflowId, productionId: workflow.productionId },
    );
    return workflow;
  }

  private async transitionTo(workflowId: string, state: WorkflowState, actorId?: string) {
    return this.prisma.workflow.update({
      where: { id: workflowId },
      data: { currentState: state, currentStep: state },
    });
  }

  // Previously took only `workflowId` with no organization check — any
  // authenticated user could fetch (and, via the WebSocket room join,
  // live-watch) ANY workflow in ANY organization by id.
  async getWithSteps(workflowId: string, organizationId: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { steps: true, approvals: true, production: { select: { organizationId: true } } },
    });
    if (!workflow || workflow.production.organizationId !== organizationId) {
      throw new NotFoundException('Workflow not found.');
    }
    const { production, ...rest } = workflow;
    return rest;
  }

  async history(workflowId: string, organizationId: string) {
    await this.assertOwnership(workflowId, organizationId);
    return this.prisma.event.findMany({ where: { workflowId }, orderBy: { timestamp: 'asc' } });
  }

  private async assertOwnership(workflowId: string, organizationId: string): Promise<void> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { production: { select: { organizationId: true } } },
    });
    if (!workflow || workflow.production.organizationId !== organizationId) {
      throw new NotFoundException('Workflow not found.');
    }
  }

  /** Backs the MCP server's record_workflow_note tool — a durable, auditable
   *  note distinct from a step's structured output, attributed to whichever
   *  caller (human or agent-via-MCP) supplied it. */
  async addNote(workflowId: string, note: string, source: string, organizationId: string) {
    await this.assertOwnership(workflowId, organizationId);
    const workflow = await this.prisma.workflow.findUnique({ where: { id: workflowId } });

    await this.eventBus.publish(
      DomainEvent.WorkflowNoteAdded,
      { note, source },
      { workflowId, productionId: workflow!.productionId, actor: source },
    );
    return { workflowId, note, source, recorded: true };
  }
}
