import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ProductionsService } from './productions.service';
import { CreateProductionDto } from './dto/create-production.dto';
import { UpdateProductionDto } from './dto/update-production.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../authz/require-permissions.decorator';
import { PERMISSIONS } from '../authz/permissions';

@Controller('productions')
export class ProductionsController {
  constructor(private service: ProductionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCTION_READ)
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() pagination: PaginationDto) {
    return this.service.findAll(user.organizationId, pagination);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PRODUCTION_CREATE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProductionDto) {
    return this.service.create(user.organizationId, user.id, dto);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PRODUCTION_READ)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.findOne(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PRODUCTION_UPDATE)
  update(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProductionDto) {
    return this.service.update(id, user.organizationId, dto);
  }

  @Patch(':id/archive')
  @RequirePermissions(PERMISSIONS.PRODUCTION_DELETE)
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.archive(id, user.organizationId);
  }
}
