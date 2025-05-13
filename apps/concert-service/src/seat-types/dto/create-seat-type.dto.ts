import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsBoolean, IsOptional } from 'class-validator';

export class CreateSeatTypeDto {
  @ApiProperty({
    description: 'Name of the seat type',
    example: 'VIP',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the seat type',
    example: 'Premium seats with extra legroom and complimentary drinks',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Price of the seat type',
    example: 150.00,
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Total capacity for this seat type',
    example: 100,
  })
  @IsNumber()
  @IsPositive()
  capacity: number;

  @ApiProperty({
    description: 'Whether the seat type is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 