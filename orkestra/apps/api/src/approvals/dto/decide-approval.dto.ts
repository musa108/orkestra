import { IsOptional, IsString } from 'class-validator';

export class DecideApprovalDto {
  @IsOptional() @IsString() comments?: string;
}
