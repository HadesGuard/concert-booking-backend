import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDate,
  IsArray,
  IsUUID,
  IsUrl,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateConcertDto {
  @ApiProperty({
    description: 'Name of the concert',
    example: 'Summer Music Festival 2024',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description of the concert',
    example: 'A spectacular summer music festival featuring top artists',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Name of the artist or band',
    example: 'The Rolling Stones',
    required: false,
  })
  @IsString()
  @IsOptional()
  artist?: string;

  @ApiProperty({
    description: 'Venue of the concert',
    example: 'Madison Square Garden',
    required: false,
  })
  @IsString()
  @IsOptional()
  venue?: string;

  @ApiProperty({
    description: 'Start time of the concert',
    example: '2024-07-01T19:00:00Z',
    required: false,
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startTime?: Date;

  @ApiProperty({
    description: 'End time of the concert',
    example: '2024-07-01T22:00:00Z',
    required: false,
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endTime?: Date;

  @ApiProperty({
    description: 'URL of the concert image',
    example: 'https://example.com/concert-image.jpg',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    description: 'Array of seat type IDs',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  seatTypes?: string[];

  @ApiProperty({
    description: 'Whether the concert is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 