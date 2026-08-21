import { Injectable } from '@nestjs/common';
import { AgentType } from '@prisma/client';
import { BaseAgent } from './base.agent';
import { AIProvider } from '../providers/ai-provider.interface';

@Injectable()
export class ScriptAgent extends BaseAgent {
  readonly type = AgentType.SCRIPT;
  readonly identity = 'Script Agent — analyzes scripts and production briefs.';
  readonly goal = 'Extract scenes, characters, locations, complexity, and a suggested shooting order.';
  readonly constraints = ['Base output only on the supplied script/brief text.'];
  readonly outputSchema = {
    scene_list: 'array',
    characters: 'array',
    locations: 'array',
    estimated_complexity: 'string (low|medium|high)',
    suggested_shooting_order: 'array',
  };

  constructor(provider: AIProvider) {
    super(provider);
  }
}
