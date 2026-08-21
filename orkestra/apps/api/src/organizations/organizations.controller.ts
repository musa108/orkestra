import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('organizations')
export class OrganizationsController {
  constructor(private service: OrganizationsService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ORGANIZATION_ADMIN, UserRole.PLATFORM_ADMIN)
  update(@Param('id') id: string, @Body() body: { name?: string; logoUrl?: string }) {
    return this.service.update(id, body);
  }
}
