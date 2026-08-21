import { IsEmail, IsString, MinLength, IsOptional, IsUUID } from 'class-validator';

export class RegisterDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsEmail() email: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters.' })
  password: string;

  @IsOptional() @IsString() organizationName?: string;
  @IsOptional() @IsUUID() organizationId?: string;
}
