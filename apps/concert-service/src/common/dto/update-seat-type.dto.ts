import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsPositive, IsBoolean } from 'class-validator';

export class UpdateSeatTypeDto {
  @ApiProperty({
    description: 'Name of the seat type',
    example: 'VIP',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description of the seat type',
    example: 'Premium seats with extra legroom and complimentary drinks',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Price of the seat type',
    example: 150.00,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiProperty({
    description: 'Total capacity for this seat type',
    example: 100,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  capacity?: number;

  @ApiProperty({
    description: 'Whether the seat type is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 