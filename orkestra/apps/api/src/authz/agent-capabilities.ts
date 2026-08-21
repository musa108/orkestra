import { AgentType } from '@prisma/client';

/**
 * Explicit per-agent capability registry (spec sections 11-14). This is
 * the enforcement point for "AI agents must NOT inherit unrestricted
 * permissions from the user who started the workflow" — an agent's
 * allowed actions are looked up here, never derived from the human
 * who triggered the workflow.
 *
 * Static, code-defined (same reasoning as permissions.ts): capabilities
 * are a product/security decision, not something that needs runtime
 * editing today. If per-organization custom agent configs become a real
 * requirement, this is the one place that moves to a DB-backed
 * AgentCapability table — every call site (hasCapability()) stays the same.
 */
export const AGENT_CAPABILITIES: Record<AgentType, string[]> = {
  [AgentType.DIRECTOR]: [
    'production.read', 'workflow.read', 'workflow.plan', 'agent.invoke', 'approval.request',
  ],
  [AgentType.SCRIPT]: [
    'production.read', 'creative_plan.read', 'creative_plan.generate', 'production.recommend',
  ],
  [AgentType.BUDGET]: [
    'production.read', 'budget.read', 'budget.calculate', 'budget.recommend',
  ],
  [AgentType.SCHEDULE]: [
    'production.read', 'schedule.read', 'schedule.generate', 'schedule.recommend',
  ],
  [AgentType.RISK]: [
    'production.read', 'workflow.read', 'risk.analyze', 'risk.recommend',
  ],
  [AgentType.MARKETING]: [
    'production.read', 'marketing.read', 'marketing.generate', 'marketing.recommend',
  ],
  [AgentType.ANALYTICS]: [
    'production.read', 'workflow.read', 'analytics.read', 'analytics.generate',
  ],
};

/** Explicitly-denied capabilities, spelled out for the agents where the
 *  spec calls them out by name — not load-bearing (absence from the
 *  allow-list above already blocks them), but documents intent and gives
 *  the Agent detail UI something concrete to render as "Restricted". */
export const AGENT_DENIED_EXAMPLES: Partial<Record<AgentType, string[]>> = {
  [AgentType.BUDGET]: ['budget.approve', 'payment.execute', 'user.manage', 'organization.manage'],
  [AgentType.DIRECTOR]: ['budget.approve', 'payment.execute', 'organization.manage', 'user.manage'],
};

export function agentHasCapability(agentType: AgentType, capability: string): boolean {
  return AGENT_CAPABILITIES[agentType]?.includes(capability) ?? false;
}

export function capabilitiesFor(agentType: AgentType): string[] {
  return AGENT_CAPABILITIES[agentType] ?? [];
}
