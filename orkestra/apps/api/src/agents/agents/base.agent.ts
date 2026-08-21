import { AgentType } from '@prisma/client';
import { AIProvider, AgentGeneration } from '../providers/ai-provider.interface';

export interface AgentContext {
  productionId: string;
  workflowId: string;
  input: Record<string, unknown>;
}

/**
 * Every specialist agent follows the Constitution's agent contract:
 * Goal, Responsibilities, Inputs, Outputs, Tools, Constraints.
 * Concrete agents fill in `goal`, `constraints`, and `outputSchema`;
 * `execute()` is shared.
 */
export abstract class BaseAgent {
  abstract readonly type: AgentType;
  abstract readonly identity: string;
  abstract readonly goal: string;
  abstract readonly constraints: string[];
  abstract readonly outputSchema: Record<string, unknown>;

  constructor(protected provider: AIProvider) {}

  async execute(ctx: AgentContext): Promise<AgentGeneration> {
    return this.provider.generate({
      identity: this.identity,
      goal: this.goal,
      constraints: this.constraints,
      outputSchema: this.outputSchema,
      // productionId/workflowId are merged in (not just the step's own
      // input) so providers that need to address a specific production/
      // workflow — e.g. AdkAgentProvider, which routes to the ADK
      // service's /agents/{type}/execute — have what they need without
      // widening the AgentPromptSpec interface itself.
      input: { ...ctx.input, productionId: ctx.productionId, workflowId: ctx.workflowId },
    });
  }
}
