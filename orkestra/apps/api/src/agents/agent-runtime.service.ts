import { Injectable, Logger } from '@nestjs/common';
import { AgentType, AgentExecutionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { DomainEvent } from '../events/event-types';
import { AgentContext, BaseAgent } from './agents/base.agent';
import { DirectorAgent } from './agents/director.agent';
import { ScriptAgent } from './agents/script.agent';
import { BudgetAgent } from './agents/budget.agent';
import { ScheduleAgent } from './agents/schedule.agent';
import { RiskAgent } from './agents/risk.agent';
import { MarketingAgent } from './agents/marketing.agent';
import { AnalyticsAgent } from './agents/analytics.agent';

export interface AgentExecutionResult {
  executionId: string;
  agentType: AgentType;
  status: AgentExecutionStatus;
  durationMs: number;
  confidence: number;
  structuredData: Record<string, unknown>;
  reasoningSummary: string;
  nextAction?: string;
}

/**
 * Agent Runtime — loads agent definitions, builds prompts (delegated to the
 * agent classes), executes via the configured AIProvider, validates output,
 * and publishes events. Stateless (ADR-006): all state lives in Postgres
 * via the caller (Workflow Engine), not here.
 */
@Injectable()
export class AgentRuntimeService {
  private readonly logger = new Logger('AgentRuntime');
  private registry: Map<AgentType, BaseAgent>;

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    director: DirectorAgent,
    script: ScriptAgent,
    budget: BudgetAgent,
    schedule: ScheduleAgent,
    risk: RiskAgent,
    marketing: MarketingAgent,
    analytics: AnalyticsAgent,
  ) {
    const entries: Array<[AgentType, BaseAgent]> = [
      [AgentType.DIRECTOR, director],
      [AgentType.SCRIPT, script],
      [AgentType.BUDGET, budget],
      [AgentType.SCHEDULE, schedule],
      [AgentType.RISK, risk],
      [AgentType.MARKETING, marketing],
      [AgentType.ANALYTICS, analytics],
    ];
    this.registry = new Map(entries);
  }

  async run(agentType: AgentType, ctx: AgentContext): Promise<AgentExecutionResult> {
    const agent = this.registry.get(agentType);
    if (!agent) throw new Error(`Unknown agent type: ${agentType}`);

    const executionId = randomUUID();
    const start = Date.now();

    await this.eventBus.publish(
      DomainEvent.AgentStarted,
      { agentType, executionId },
      { workflowId: ctx.workflowId, productionId: ctx.productionId },
    );

    try {
      const generation = await agent.execute(ctx);
      const durationMs = Date.now() - start;

      await this.prisma.agent.upsert({
        where: { type: agentType },
        create: { name: agent.identity, type: agentType, status: AgentExecutionStatus.COMPLETED, lastExecutionAt: new Date(), confidence: generation.confidence },
        update: { status: AgentExecutionStatus.COMPLETED, lastExecutionAt: new Date(), confidence: generation.confidence },
      });

      await this.eventBus.publish(
        DomainEvent.AgentCompleted,
        { agentType, executionId, durationMs, confidence: generation.confidence },
        { workflowId: ctx.workflowId, productionId: ctx.productionId },
      );

      return {
        executionId,
        agentType,
        status: AgentExecutionStatus.COMPLETED,
        durationMs,
        confidence: generation.confidence,
        structuredData: generation.structured_data,
        reasoningSummary: generation.reasoning_summary,
      };
    } catch (err) {
      this.logger.error(`Agent ${agentType} failed`, err as Error);
      await this.eventBus.publish(
        DomainEvent.AgentFailed,
        { agentType, executionId, error: (err as Error).message },
        { workflowId: ctx.workflowId, productionId: ctx.productionId },
      );
      throw err;
    }
  }
}
