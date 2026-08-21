import {
  Body, Controller, Get, Param, Post, Query, Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AssetsService } from './assets.service';
import { UploadAssetDto } from './dto/upload-asset.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../authz/require-permissions.decorator';
import { PERMISSIONS } from '../authz/permissions';

@Controller('assets')
export class AssetsController {
  constructor(private service: AssetsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ASSET_READ)
  findByProduction(@Query('productionId') productionId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.findByProduction(productionId, user.organizationId);
  }

  @Post('upload')
  @RequirePermissions(PERMISSIONS.ASSET_CREATE)
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadAssetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.upload(dto.productionId, user.id, user.organizationId, file);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ASSET_READ)
  async download(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const { buffer, filename, fileType } = await this.service.download(id, user.organizationId);
    res.setHeader('Content-Type', fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
