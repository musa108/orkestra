import { Global, Module } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { ToolAuthorizationService } from './tool-authorization.service';

@Global()
@Module({
  providers: [PermissionsGuard, ToolAuthorizationService],
  exports: [PermissionsGuard, ToolAuthorizationService],
})
export class AuthzModule {}
