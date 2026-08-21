import { IsOptional, IsString, IsUUID } from 'class-validator';

export class StartWorkflowDto {
  @IsUUID() productionId: string;
  @IsOptional() @IsString() brief?: string; // production brief / script text
}
