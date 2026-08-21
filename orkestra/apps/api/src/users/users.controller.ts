import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(user.organizationId, pagination, search);
  }

  @Post()
  @Roles(UserRole.ORGANIZATION_ADMIN, UserRole.PLATFORM_ADMIN)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.service.create(user.organizationId, dto);
  }

  // Previously had NO role restriction and NO organization check at all —
  // any authenticated user, regardless of role, could edit any other
  // user's profile or role system-wide just by knowing their id. Fixed:
  // requires ORGANIZATION_ADMIN/PLATFORM_ADMIN, and the service verifies
  // the target user actually belongs to the caller's organization.
  @Patch(':id')
  @Roles(UserRole.ORGANIZATION_ADMIN, UserRole.PLATFORM_ADMIN)
  update(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateUserDto) {
    return this.service.update(id, user.organizationId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ORGANIZATION_ADMIN, UserRole.PLATFORM_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.softDelete(id, user.organizationId, user.id);
  }
}
