import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

// @Global so PermissionsGuard/RolesGuard (registered as APP_GUARD in
// AppModule) can inject it without every feature module importing AuditModule.
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
