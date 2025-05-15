import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { SeatTypeDto } from './create-seat-types.dto';

export class CreateSeatTypeDto {
  @ApiProperty({ type: [SeatTypeDto] })
  @IsArray()
  seatTypes: SeatTypeDto[];
}