import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuditService } from '../../audit/audit.service';

/** Coarse role gate — prefer @RequirePermissions() (authz/permissions.guard.ts)
 *  for anything business-logic-shaped. @Roles() stays for the handful of
 *  platform/org-admin-only endpoints where "is this role" genuinely is
 *  the right question (e.g. organization settings), not a stand-in for
 *  granular permission checks everywhere. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private audit: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const allowed = !!user && requiredRoles.includes(user.role);

    if (!allowed) {
      await this.audit.log({
        organizationId: user?.organizationId,
        actorId: user?.id,
        actorType: 'HUMAN',
        action: 'AUTHORIZATION_DENIED',
        resourceType: context.getClass().name,
        result: 'DENIED',
        reason: `Requires role: ${requiredRoles.join(' or ')}`,
        correlationId: req.correlationId,
      });
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    return true;
  }
}
