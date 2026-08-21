import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.service.dashboard(user.organizationId);
  }

  @Get('productions/:id')
  production(@Param('id') id: string) {
    return this.service.production(id);
  }

  @Get('agents')
  agents() {
    return this.service.agentPerformance();
  }
}
