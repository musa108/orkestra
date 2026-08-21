import { AgentType } from '@prisma/client';

// The MVP execution graph: Director plans, then specialists run. Budget
// and Marketing don't depend on each other so they run in parallel; Risk
// runs after Budget+Schedule since it needs their output; Analytics runs
// last. This resolves the ambiguity between the doc set's linear worked
// example and its fan-out topology diagram — real dependencies decide
// order, not document sequence.
export interface StepDefinition {
  name: string;
  agent: AgentType;
  dependsOn: string[]; // step names
  requiresApproval?: boolean;
  /** Maps this step to a registered tool (see authz/tool-registry.ts) —
   *  when present, WorkflowEngineService checks it via
   *  ToolAuthorizationService before running the agent, so the
   *  capability/risk/approval gate is enforced on the actual execution
   *  path, not just declared in the registry and never consulted. */
  tool?: string;
}

export const MVP_WORKFLOW_STEPS: StepDefinition[] = [
  { name: 'director-plan', agent: AgentType.DIRECTOR, dependsOn: [], tool: 'workflow.plan' },
  { name: 'script-analysis', agent: AgentType.SCRIPT, dependsOn: ['director-plan'] },
  { name: 'schedule-generation', agent: AgentType.SCHEDULE, dependsOn: ['script-analysis'], tool: 'schedule.generate' },
  { name: 'budget-generation', agent: AgentType.BUDGET, dependsOn: ['script-analysis'], tool: 'budget.calculate' },
  { name: 'risk-assessment', agent: AgentType.RISK, dependsOn: ['schedule-generation', 'budget-generation'], tool: 'risk.analyze' },
  { name: 'budget-approval', agent: AgentType.BUDGET, dependsOn: ['risk-assessment'], requiresApproval: true, tool: 'budget.increase' },
  { name: 'marketing-plan', agent: AgentType.MARKETING, dependsOn: ['budget-approval'], tool: 'marketing.generate' },
  { name: 'analytics-summary', agent: AgentType.ANALYTICS, dependsOn: ['marketing-plan'] },
];
