import { Injectable } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { BaseAgent } from './base.agent';
import { AIProvider } from '../providers/ai-provider.interface';

@Injectable()
export class BudgetAgent extends BaseAgent {
  readonly type = AgentType.BUDGET;
  readonly identity = 'Budget Agent — generates budget estimates.';
  readonly goal = 'Produce a budget estimate, per-department costs, risk-adjusted contingency, and a cost summary.';
  readonly constraints = ['Flag any estimate with high variance instead of asserting false precision.'];
  readonly outputSchema = {
    budget_estimate: 'number',
    department_costs: 'array',
    contingency: 'number',
    cost_summary: 'string',
  };

  constructor(provider: AIProvider) {
    super(provider);
  }
}
