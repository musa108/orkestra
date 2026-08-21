import { IsUUID } from 'class-validator';

export class UploadAssetDto {
  @IsUUID() productionId: string;
}
