import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsBoolean,
  IsOptional,
} from 'class-validator';

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
    example: 'VIP seats with premium view and amenities',
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
    description: 'Total number of seats available',
    example: 100,
  })
  @IsNumber()
  @IsPositive()
  totalSeats: number;

  @ApiProperty({
    description: 'Number of available seats',
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