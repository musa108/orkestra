import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductionDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() genre?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsNumber() budget?: number;
}
