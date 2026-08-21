import { AgentType } from '@prisma/client';

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Tool {
  name: string;
  requiredCapability: string;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
}

/**
 * Explicit tool registry (spec section 14): "never allow an agent to call
 * an arbitrary backend method." Every mutating action an agent can trigger
 * is named here with its required capability, risk level, and whether it
 * needs human sign-off — ToolAuthorizationService checks a call against
 * this registry before AgentRuntimeService is allowed to execute it.
 *
 * This scaffold's agents are currently read/recommend-oriented (they
 * return structured output for the Workflow Engine to persist, per
 * "agents never modify workflow state directly" — ADR-014), so most
 * registered tools here are LOW risk. The two that model a real mutating
 * action agents could eventually be given (budget increase, schedule
 * change) are marked requiresApproval so the pattern is demonstrated even
 * though the Budget/Schedule agents don't currently call them directly —
 * the Workflow Engine's approval-gated step (workflow-definition.ts)
 * enforces the same outcome today via the workflow graph rather than a
 * live tool call.
 */
export const TOOL_REGISTRY: Record<string, Tool> = {
  'budget.calculate': {
    name: 'budget.calculate', requiredCapability: 'budget.calculate',
    riskLevel: RiskLevel.LOW, requiresApproval: false,
  },
  'budget.recommend': {
    name: 'budget.recommend', requiredCapability: 'budget.recommend',
    riskLevel: RiskLevel.LOW, requiresApproval: false,
  },
  'budget.increase': {
    name: 'budget.increase', requiredCapability: 'budget.approve',
    riskLevel: RiskLevel.HIGH, requiresApproval: true,
  },
  'schedule.generate': {
    name: 'schedule.generate', requiredCapability: 'schedule.generate',
    riskLevel: RiskLevel.LOW, requiresApproval: false,
  },
  'schedule.change_dates': {
    name: 'schedule.change_dates', requiredCapability: 'schedule.approve',
    riskLevel: RiskLevel.HIGH, requiresApproval: true,
  },
  'risk.analyze': {
    name: 'risk.analyze', requiredCapability: 'risk.analyze',
    riskLevel: RiskLevel.LOW, requiresApproval: false,
  },
  'marketing.generate': {
    name: 'marketing.generate', requiredCapability: 'marketing.generate',
    riskLevel: RiskLevel.LOW, requiresApproval: false,
  },
  'workflow.plan': {
    name: 'workflow.plan', requiredCapability: 'workflow.plan',
    riskLevel: RiskLevel.LOW, requiresApproval: false,
  },
  'production.delete': {
    name: 'production.delete', requiredCapability: 'production.delete',
    riskLevel: RiskLevel.CRITICAL, requiresApproval: true,
  },
};

export function getTool(name: string): Tool | undefined {
  return TOOL_REGISTRY[name];
}
