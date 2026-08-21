import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './require-permissions.decorator';
import { Permission, roleHasPermission } from './permissions';
import { AuditService } from '../audit/audit.service';

/** Registered globally (see app.module.ts) alongside JwtAuthGuard/RolesGuard.
 *  Routes with no @RequirePermissions() pass through untouched — this guard
 *  only activates where a controller explicitly opts in, same pattern as
 *  RolesGuard, but checking granular permissions instead of a raw role. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private audit: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return false;

    const missing = required.filter((p) => !roleHasPermission(user.role, p));
    if (missing.length > 0) {
      await this.audit.log({
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: 'HUMAN',
        action: 'AUTHORIZATION_DENIED',
        resourceType: context.getClass().name,
        result: 'DENIED',
        reason: `Missing permission(s): ${missing.join(', ')}`,
        correlationId: req.correlationId,
      });
      // Spec section 21 — don't disclose which permission or why in the
      // response body; the real reason is in the audit log only.
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    return true;
  }
}
