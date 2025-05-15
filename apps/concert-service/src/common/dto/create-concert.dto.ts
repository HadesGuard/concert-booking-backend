import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsArray,
  IsUrl,
  IsBoolean,
  IsOptional,
  Validate,
  MinLength,
  MaxLength,
  IsEnum,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsAfterDate } from '../../validators/is-after-date.validator';
import { SeatTypeEnum } from '../enums/seat-type.enum';

export class CreateConcertDto {
  @ApiProperty({
    description: 'Name of the concert',
    example: 'Summer Music Festival 2024',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Description of the concert',
    example: 'A spectacular summer music festival featuring top artists',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @ApiProperty({
    description: 'Name of the artist or band',
    example: 'The Rolling Stones',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  artist: string;

  @ApiProperty({
    description: 'Venue of the concert',
    example: 'Madison Square Garden',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  venue: string;

  @ApiProperty({
    description: 'Start time of the concert',
    example: '2024-07-01T19:00:00Z',
  })
  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @ApiProperty({
    description: 'End time of the concert',
    example: '2024-07-01T22:00:00Z',
  })
  @Type(() => Date)
  @IsDate()
  @Validate(IsAfterDate, ['startTime'])
  endTime: Date;

  @ApiProperty({
    description: 'URL of the concert image',
    example: 'https://example.com/concert-image.jpg',
  })
  @IsUrl()
  imageUrl: string;

  @ApiProperty({
    description: 'Array of seat type IDs',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsArray()
  @IsEnum(SeatTypeEnum, { each: true })
  @ArrayMinSize(1)
  seatTypes: SeatTypeEnum[];

  @ApiProperty({
    description: 'Whether the concert is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 