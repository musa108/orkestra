import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('search')
export class SearchController {
  constructor(private service: SearchService) {}

  @Get()
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') q: string,
    @Query('type') type?: 'production' | 'task' | 'user' | 'all',
  ) {
    return this.service.search(user.organizationId, q, type ?? 'all');
  }
}
