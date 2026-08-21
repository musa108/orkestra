import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsEmail() email: string;
  @IsString() @MinLength(12) password: string;
  @IsEnum(UserRole) role: UserRole;
}
