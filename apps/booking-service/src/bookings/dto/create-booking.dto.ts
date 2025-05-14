import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'user-uuid-v4' })
  @IsUUID('4')
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'concert-uuid-v4' })
  @IsUUID('4')
  @IsNotEmpty()
  concertId: string;

  @ApiProperty({ example: 'seat-type-uuid-v4' })
  @IsUUID('4')
  @IsNotEmpty()
  seatTypeId: string;
} 