import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUrl, Length, Matches, MinLength } from 'class-validator';
import { Role } from '../../../../../libs/shared/src/common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @Length(2, 50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @Length(2, 50)
  lastName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiProperty({ enum: Role, example: Role.BUYER })
  @IsEnum(Role)
  role: Role;
}