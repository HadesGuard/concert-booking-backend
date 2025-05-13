import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsArray,
  IsUUID,
  IsUrl,
  IsBoolean,
  IsOptional,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsAfterDate } from '../validators/is-after-date.validator';

export class CreateConcertDto {
  @ApiProperty({
    description: 'Name of the concert',
    example: 'Summer Music Festival 2024',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the concert',
    example: 'A spectacular summer music festival featuring top artists',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Name of the artist or band',
    example: 'The Rolling Stones',
  })
  @IsString()
  @IsNotEmpty()
  artist: string;

  @ApiProperty({
    description: 'Venue of the concert',
    example: 'Madison Square Garden',
  })
  @IsString()
  @IsNotEmpty()
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
  @IsUUID('4', { each: true })
  seatTypes: string[];

  @ApiProperty({
    description: 'Whether the concert is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 