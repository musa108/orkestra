import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../authz/require-permissions.decorator';
import { PERMISSIONS } from '../authz/permissions';

@Controller('tasks')
export class TasksController {
  constructor(private service: TasksService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.TASK_READ)
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('productionId') productionId?: string) {
    return this.service.findAll(user.organizationId, productionId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.TASK_CREATE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTaskDto) {
    return this.service.create(user.organizationId, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.TASK_UPDATE)
  update(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() body: any) {
    return this.service.update(id, user.organizationId, body);
  }

  @Post(':id/complete')
  @RequirePermissions(PERMISSIONS.TASK_UPDATE)
  complete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.complete(id, user.organizationId);
  }
}
