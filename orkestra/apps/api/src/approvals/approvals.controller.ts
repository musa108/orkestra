import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { DecideApprovalDto } from './dto/decide-approval.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../authz/require-permissions.decorator';
import { PERMISSIONS } from '../authz/permissions';

@Controller('approvals')
export class ApprovalsController {
  constructor(private service: ApprovalsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.APPROVAL_READ)
  pending(@CurrentUser() user: AuthenticatedUser) {
    return this.service.pending(user.organizationId);
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.APPROVAL_APPROVE)
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: DecideApprovalDto) {
    return this.service.approve(id, user.id, user.organizationId, dto.comments);
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.APPROVAL_REJECT)
  reject(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: DecideApprovalDto) {
    return this.service.reject(id, user.id, user.organizationId, dto.comments);
  }
}
