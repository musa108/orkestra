import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductionStatus } from '@prisma/client';

export class UpdateProductionDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(ProductionStatus) status?: ProductionStatus;
}
