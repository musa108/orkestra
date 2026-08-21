import { UserRole } from '@prisma/client';

/**
 * Granular permission strings (spec section 9). Roles map to permissions
 * rather than business logic checking roles directly — services/guards
 * call permissionService.can(user, 'production:update'), never
 * `if (user.role === 'PRODUCER')`.
 *
 * Implementation note: this is a static, code-defined map rather than
 * DB-backed Permission/RolePermission tables. The spec allows "an
 * equivalent reusable authorization mechanism" — a static map gives the
 * same call-site API (`can()`) and the same guarantee (no hardcoded role
 * checks scattered through controllers) without the added complexity of
 * making permissions runtime-editable, which nothing in the product
 * currently requires. If per-organization custom roles become a real
 * requirement, this map is the one place that changes to read from a DB
 * table instead — every call site stays the same.
 */
export const PERMISSIONS = {
  PRODUCTION_CREATE: 'production:create',
  PRODUCTION_READ: 'production:read',
  PRODUCTION_UPDATE: 'production:update',
  PRODUCTION_DELETE: 'production:delete',

  WORKFLOW_CREATE: 'workflow:create',
  WORKFLOW_READ: 'workflow:read',
  WORKFLOW_EXECUTE: 'workflow:execute',
  WORKFLOW_PAUSE: 'workflow:pause',
  WORKFLOW_RESUME: 'workflow:resume',
  WORKFLOW_CANCEL: 'workflow:cancel',

  TASK_CREATE: 'task:create',
  TASK_READ: 'task:read',
  TASK_UPDATE: 'task:update',
  TASK_ASSIGN: 'task:assign',

  APPROVAL_CREATE: 'approval:create',
  APPROVAL_READ: 'approval:read',
  APPROVAL_APPROVE: 'approval:approve',
  APPROVAL_REJECT: 'approval:reject',

  AGENT_READ: 'agent:read',
  AGENT_CONFIGURE: 'agent:configure',
  AGENT_EXECUTE: 'agent:execute',

  ANALYTICS_READ: 'analytics:read',

  ASSET_CREATE: 'asset:create',
  ASSET_READ: 'asset:read',

  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_UPDATE: 'organization:update',
  ORGANIZATION_MANAGE_USERS: 'organization:manage_users',
  ORGANIZATION_MANAGE_SETTINGS: 'organization:manage_settings',

  PLATFORM_MANAGE: 'platform:manage', // PLATFORM_ADMIN only
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const P = PERMISSIONS;

const READ_ONLY: Permission[] = [
  P.PRODUCTION_READ, P.WORKFLOW_READ, P.TASK_READ, P.APPROVAL_READ,
  P.AGENT_READ, P.ANALYTICS_READ, P.ASSET_READ, P.ORGANIZATION_READ,
];

const TEAM_MEMBER: Permission[] = [
  ...READ_ONLY,
  P.TASK_UPDATE, P.ASSET_CREATE,
];

const PRODUCTION_MANAGER: Permission[] = [
  ...TEAM_MEMBER,
  P.TASK_CREATE, P.TASK_ASSIGN, P.WORKFLOW_PAUSE, P.WORKFLOW_RESUME,
];

const PRODUCER: Permission[] = [
  ...PRODUCTION_MANAGER,
  P.PRODUCTION_CREATE, P.PRODUCTION_UPDATE,
  P.WORKFLOW_CREATE, P.WORKFLOW_EXECUTE, P.WORKFLOW_CANCEL,
  P.APPROVAL_CREATE, P.AGENT_EXECUTE,
];

const EXECUTIVE_PRODUCER: Permission[] = [
  ...PRODUCER,
  P.APPROVAL_APPROVE, P.APPROVAL_REJECT,
];

const ORGANIZATION_ADMIN: Permission[] = [
  ...EXECUTIVE_PRODUCER,
  P.PRODUCTION_DELETE, P.AGENT_CONFIGURE,
  P.ORGANIZATION_UPDATE, P.ORGANIZATION_MANAGE_USERS, P.ORGANIZATION_MANAGE_SETTINGS,
];

const PLATFORM_ADMIN: Permission[] = [
  ...ORGANIZATION_ADMIN,
  P.PLATFORM_MANAGE,
];

/** Role -> Permission[] map (spec section 9's worked example, extended to
 *  every role). VIEWER intentionally gets read-only and nothing else. */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.VIEWER]: READ_ONLY,
  [UserRole.TEAM_MEMBER]: TEAM_MEMBER,
  [UserRole.PRODUCTION_MANAGER]: PRODUCTION_MANAGER,
  [UserRole.PRODUCER]: PRODUCER,
  [UserRole.EXECUTIVE_PRODUCER]: EXECUTIVE_PRODUCER,
  [UserRole.ORGANIZATION_ADMIN]: ORGANIZATION_ADMIN,
  [UserRole.PLATFORM_ADMIN]: PLATFORM_ADMIN,
};

export function permissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}
