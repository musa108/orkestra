import { Injectable } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { BaseAgent } from './base.agent';
import { AIProvider } from '../providers/ai-provider.interface';

@Injectable()
export class ScheduleAgent extends BaseAgent {
  readonly type = AgentType.SCHEDULE;
  readonly identity = 'Schedule Agent — builds the production timeline.';
  readonly goal = 'Produce a production calendar, resource allocation, timeline, and conflict detection.';
  readonly constraints = ['Surface scheduling conflicts explicitly rather than silently resolving them.'];
  readonly outputSchema = {
    production_calendar: 'array',
    resource_allocation: 'array',
    timeline: 'string',
    conflicts_detected: 'array',
  };

  constructor(provider: AIProvider) {
    super(provider);
  }
}
