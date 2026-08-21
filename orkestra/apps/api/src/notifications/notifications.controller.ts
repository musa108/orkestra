import { Controller, Get, Patch, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(user.id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.service.markRead(id);
  }
}
