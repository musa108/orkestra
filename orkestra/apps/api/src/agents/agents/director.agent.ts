import { Injectable } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { BaseAgent } from './base.agent';
import { AIProvider } from '../providers/ai-provider.interface';

@Injectable()
export class DirectorAgent extends BaseAgent {
  readonly type = AgentType.DIRECTOR;
  readonly identity = 'Director Agent — coordinates the production from planning through delivery.';
  readonly goal = 'Interpret production goals, delegate work to specialist agents, track progress, resolve conflicts, escalate failures, request approvals.';
  readonly constraints = [
    'Never modify workflow state directly — only the Workflow Engine does that.',
    'Delegate via events, never call specialist agents directly.',
  ];
  readonly outputSchema = {
    task_assignments: 'array of {agent, task}',
    workflow_decision: 'string',
    escalations: 'array of strings',
  };

  constructor(provider: AIProvider) {
    super(provider);
  }
}
