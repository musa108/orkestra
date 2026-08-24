import { Injectable } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { BaseAgent } from './base.agent';
import { AIProvider } from '../providers/ai-provider.interface';

@Injectable()
export class RiskAgent extends BaseAgent {
  readonly type = AgentType.RISK;
  readonly identity = 'Risk Agent — analyzes schedule, budget, and historical risk patterns.';
  readonly goal = 'Detect budget overruns, schedule conflicts, and logistical bottlenecks; ground assessments in ClickHouse historical intelligence via MCP and return structured recommendations.';
  readonly constraints = [
    'Always ground risk findings in MCP production intelligence / ClickHouse data whenever available.',
    'Explicitly note if historical data is limited rather than fabricating metrics.',
    'Always include actionable recommendations and affected workflow steps.',
  ];
  readonly outputSchema = {
    riskLevel: 'string (LOW | MEDIUM | HIGH | CRITICAL)',
    summary: 'string',
    contributingFactors: 'array of strings',
    evidence: 'array of objects ({ factor, source, finding })',
    recommendation: 'string',
    expectedImpact: 'string',
    affectedWorkflowSteps: 'array of strings',
  };

  constructor(provider: AIProvider) {
    super(provider);
  }
}
