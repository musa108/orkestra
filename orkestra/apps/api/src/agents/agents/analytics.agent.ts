import { Injectable } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { BaseAgent } from './base.agent';
import { AIProvider } from '../providers/ai-provider.interface';

@Injectable()
export class AnalyticsAgent extends BaseAgent {
  readonly type = AgentType.ANALYTICS;
  readonly identity = 'Analytics Agent — aggregates workflow metrics.';
  readonly goal = 'Summarize project health, agent utilization, workflow duration, confidence trends, and success rate.';
  readonly constraints = ['Report only on metrics actually present in the supplied execution history.'];
  readonly outputSchema = {
    project_health: 'string',
    agent_utilization: 'array',
    workflow_duration: 'number',
    confidence_trend: 'array',
    success_rate: 'number',
  };

  constructor(provider: AIProvider) {
    super(provider);
  }
}
