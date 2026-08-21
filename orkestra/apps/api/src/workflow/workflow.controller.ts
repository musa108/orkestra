import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../authz/require-permissions.decorator';
import { PERMISSIONS } from '../authz/permissions';

@Controller('workflows')
export class WorkflowController {
  constructor(private engine: WorkflowEngineService) {}

  @Post('start')
  @RequirePermissions(PERMISSIONS.WORKFLOW_CREATE)
  start(@Body() dto: StartWorkflowDto, @CurrentUser() user: AuthenticatedUser) {
    return this.engine.start(dto.productionId, dto.brief, user.id, user.organizationId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.WORKFLOW_READ)
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.engine.getWithSteps(id, user.organizationId);
  }

  @Post(':id/pause')
  @RequirePermissions(PERMISSIONS.WORKFLOW_PAUSE)
  pause(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.engine.pause(id, user.organizationId);
  }

  @Post(':id/resume')
  @RequirePermissions(PERMISSIONS.WORKFLOW_RESUME)
  resume(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.engine.resume(id, user.organizationId);
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.WORKFLOW_CANCEL)
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.engine.cancel(id, user.organizationId);
  }

  @Get(':id/history')
  @RequirePermissions(PERMISSIONS.WORKFLOW_READ)
  history(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.engine.history(id, user.organizationId);
  }

  // Called by the MCP server's record_workflow_note tool using a
  // service-account JWT (see services/mcp-server) — still goes through the
  // same org-ownership check as every other route, no special-casing.
  @Post(':id/notes')
  @RequirePermissions(PERMISSIONS.WORKFLOW_READ)
  addNote(
    @Param('id') id: string,
    @Body('note') note: string,
    @Body('source') source: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.engine.addNote(id, note, source ?? 'api', user.organizationId);
  }
}
