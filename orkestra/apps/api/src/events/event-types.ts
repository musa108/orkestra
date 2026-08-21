// Canonical domain event names — PascalCase, per the resolved naming
// convention (fixes the SCREAMING_SNAKE_CASE / PascalCase / camelCase
// drift found across the original doc set).
//
// The WebSocket gateway transforms these to camelCase on the wire
// (see workflow.gateway.ts) — that transform is the *only* place casing
// changes; internally everything is PascalCase.

export enum DomainEvent {
  ProductionCreated = 'ProductionCreated',
  ProductionPublished = 'ProductionPublished',

  WorkflowStarted = 'WorkflowStarted',
  WorkflowStepStarted = 'StepStarted',
  WorkflowStepCompleted = 'StepCompleted',
  WorkflowCompleted = 'WorkflowCompleted',
  WorkflowFailed = 'WorkflowFailed',

  AgentAssigned = 'AgentAssigned',
  AgentStarted = 'AgentStarted',
  AgentCompleted = 'AgentCompleted',
  AgentFailed = 'AgentFailed',

  RiskDetected = 'RiskDetected',
  BudgetGenerated = 'BudgetGenerated',
  ScheduleGenerated = 'ScheduleGenerated',
  ScriptAnalyzed = 'ScriptAnalyzed',
  MarketingPlanGenerated = 'MarketingPlanGenerated',

  ApprovalRequested = 'ApprovalRequested',
  ApprovalGranted = 'ApprovalGranted',
  ApprovalRejected = 'ApprovalRejected',
  ApprovalExpired = 'ApprovalExpired',

  WorkflowNoteAdded = 'WorkflowNoteAdded',

  NotificationCreated = 'NotificationCreated',
}

export interface DomainEventPayload<T = Record<string, unknown>> {
  id: string;
  type: DomainEvent;
  workflowId?: string;
  productionId?: string;
  organizationId?: string;
  correlationId: string;
  actor?: string;
  timestamp: string;
  payload: T;
}
