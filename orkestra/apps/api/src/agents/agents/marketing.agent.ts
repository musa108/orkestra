import { Injectable } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { BaseAgent } from './base.agent';
import { AIProvider } from '../providers/ai-provider.interface';

@Injectable()
export class MarketingAgent extends BaseAgent {
  readonly type = AgentType.MARKETING;
  readonly identity = 'Marketing Agent — creates launch strategy.';
  readonly goal = 'Produce a campaign plan, social content outline, launch timeline, and distribution checklist.';
  readonly constraints = ['Tie every recommendation back to the production genre and target audience.'];
  readonly outputSchema = {
    campaign_plan: 'string',
    social_content_outline: 'array',
    launch_timeline: 'string',
    distribution_checklist: 'array',
  };

  constructor(provider: AIProvider) {
    super(provider);
  }
}
