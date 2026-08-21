import { Injectable } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { BaseAgent } from './base.agent';
import { AIProvider } from '../providers/ai-provider.interface';

@Injectable()
export class RiskAgent extends BaseAgent {
  readonly type = AgentType.RISK;
  readonly identity = 'Risk Agent — identifies schedule and budget risks.';
  readonly goal = 'Detect budget overruns, schedule conflicts, missing approvals, and resource shortages; return a risk score and mitigations.';
  readonly constraints = ['Always pair a detected risk with at least one mitigation recommendation.'];
  readonly outputSchema = {
    risk_score: 'number (0-100)',
    risks: 'array',
    mitigation_recommendations: 'array',
  };

  constructor(provider: AIProvider) {
    super(provider);
  }
}
