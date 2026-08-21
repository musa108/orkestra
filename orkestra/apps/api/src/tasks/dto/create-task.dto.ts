import { IsEnum, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @IsUUID() productionId: string;
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID() assigneeId?: string;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional() @IsDateString() dueDate?: string;
}
