import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Doe',
    required: true,
  })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'The password of the user (minimum 6 characters)',
    example: 'password123',
    required: true,
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    description: 'The role of the user (defaults to "user")',
    example: 'user',
    required: false,
    enum: ['user', 'admin'],
    default: 'user',
  })
  @IsString()
  @IsOptional()
  role?: string;
}
