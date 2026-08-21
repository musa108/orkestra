import { SetMetadata } from '@nestjs/common';
import { Permission } from './permissions';

export const PERMISSIONS_KEY = 'requiredPermissions';

/** Attach to a controller method: @RequirePermissions(PERMISSIONS.PRODUCTION_UPDATE).
 *  Enforced by PermissionsGuard — never check user.role directly in a
 *  controller/service (spec section 9's "avoid hardcoded role checks"). */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
