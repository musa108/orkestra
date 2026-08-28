import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { DomainEvent } from '../events/event-types';
import { WorkflowEngineService } from '../workflow/workflow-engine.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private workflowEngine: WorkflowEngineService,
    private audit: AuditService,
  ) {}

  async pending(organizationId: string) {
    return this.prisma.approval.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        production: { organizationId },
      },
      include: { production: { select: { id: true, title: true } }, workflow: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, decidedById: string, organizationId: string, comments?: string) {
    const approval = await this.getPending(id, organizationId);
    this.assertNotSelfApproval(approval, decidedById);

    const updated = await this.prisma.approval.update({
      where: { id },
      data: { status: ApprovalStatus.APPROVED, decidedById, decidedAt: new Date(), comments },
    });

    await this.audit.log({
      organizationId, actorId: decidedById, action: 'APPROVAL_APPROVED',
      resourceType: 'Approval', resourceId: id, result: 'SUCCESS',
    });

    await this.eventBus.publish(
      DomainEvent.ApprovalGranted,
      { approvalId: id },
      { workflowId: approval.workflowId, productionId: approval.productionId, actor: decidedById },
    );

    // Extract the step name from the approval proposedChanges or comments
    const proposedChanges = (approval.proposedChanges as any) || {};
    const stepName =
      proposedChanges.stepName ||
      (approval.action?.startsWith('budget-approval') ? 'budget-approval' : undefined) ||
      approval.comments?.replace(/^Approval required for step: /, '') ||
      undefined;
    await this.workflowEngine.resumeAfterApproval(approval.workflowId, stepName);
    return updated;
  }

  async reject(id: string, decidedById: string, organizationId: string, comments?: string) {
    const approval = await this.getPending(id, organizationId);
    this.assertNotSelfApproval(approval, decidedById);

    const updated = await this.prisma.approval.update({
      where: { id },
      data: { status: ApprovalStatus.REJECTED, decidedById, decidedAt: new Date(), comments },
    });

    await this.audit.log({
      organizationId, actorId: decidedById, action: 'APPROVAL_REJECTED',
      resourceType: 'Approval', resourceId: id, result: 'SUCCESS',
    });

    await this.eventBus.publish(
      DomainEvent.ApprovalRejected,
      { approvalId: id },
      { workflowId: approval.workflowId, productionId: approval.productionId, actor: decidedById },
    );

    const proposedChanges = (approval.proposedChanges as any) || {};
    const stepName =
      proposedChanges.stepName ||
      (approval.action?.startsWith('budget-approval') ? 'budget-approval' : undefined) ||
      approval.comments?.replace(/^Approval required for step: /, '') ||
      undefined;
    await this.workflowEngine.handleApprovalRejection(approval.workflowId, stepName);

    return updated;
  }

  /** Called on a schedule (cron / background job) to escalate expired approvals. */
  async expireOverdue() {
    const overdue = await this.prisma.approval.findMany({
      where: { status: ApprovalStatus.PENDING, expiresAt: { lt: new Date() } },
    });

    for (const approval of overdue) {
      await this.prisma.approval.update({
        where: { id: approval.id },
        data: { status: ApprovalStatus.EXPIRED, expiredAt: new Date() },
      });
      await this.eventBus.publish(
        DomainEvent.ApprovalExpired,
        { approvalId: approval.id },
        { workflowId: approval.workflowId, productionId: approval.productionId },
      );
    }
    return overdue.length;
  }

  // Previously took only `id` with no organization check — any
  // authenticated user, from ANY organization, could approve or reject
  // ANY pending approval in the entire system just by knowing its id.
  // This was the single most severe bug found in the whole codebase.
  private async getPending(id: string, organizationId: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
      include: { production: { select: { organizationId: true } } },
    });
    if (!approval || approval.production.organizationId !== organizationId) {
      throw new NotFoundException('Approval not found.');
    }
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Approval has already been decided or has expired.');
    }
    return approval;
  }

  /** Spec section 19: "An agent must never approve its own request" and,
   *  by default, a human should not approve their own request either
   *  (separation of duties). requestedByType===AGENT approvals are always
   *  fine for a human to decide — this only blocks a human approving
   *  their own human-requested approval. */
  private assertNotSelfApproval(approval: { requestedById: string; requestedByType: string; id: string }, decidedById: string) {
    if (approval.requestedByType === 'HUMAN' && approval.requestedById === decidedById) {
      throw new ForbiddenException('You cannot approve a request you submitted yourself.');
    }
  }
}
