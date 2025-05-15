import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString, IsNumber, IsPositive, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SeatTypeDto {
  @ApiProperty({
    description: 'Name of the seat type',
    example: 'VIP',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Price of the seat type',
    example: 100,
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Quantity of seats available',
    example: 1000,
  })
  @IsNumber()
  @IsPositive()
  capacity: number

  @ApiProperty({
    description: 'Description of the seat type',
    example: 'Premium seats with extra legroom and complimentary drinks',
  })
  @IsString()
  description: string;
  
}

export class CreateSeatTypesDto {
  @ApiProperty({
    description: 'Array of seat types to create',
    type: [SeatTypeDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatTypeDto)
  seatTypes: SeatTypeDto[];
} 