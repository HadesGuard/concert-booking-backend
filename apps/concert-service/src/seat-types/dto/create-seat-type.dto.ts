import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, Min } from 'class-validator';
import { SeatTypeDto } from '../../concerts/dto/create-seat-types.dto';

export class CreateSeatTypeDto {
  @ApiProperty({ type: [SeatTypeDto] })
  @IsArray()
  seatTypes: SeatTypeDto[];
}