import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConcertsService } from './concerts.service';
import { CreateConcertDto } from './dto/create-concert.dto';
import { CreateSeatTypeDto } from './dto/create-seat-type.dto';
import { JwtAuthGuard } from '@app/common';

@ApiTags('concerts')
@Controller('concerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new concert' })
  @ApiResponse({
    status: 201,
    description: 'The concert has been successfully created.',
  })
  async create(@Body() createConcertDto: CreateConcertDto) {
    return this.concertsService.create(createConcertDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all concerts' })
  @ApiResponse({
    status: 200,
    description: 'Return all concerts.',
  })
  async findAll() {
    return this.concertsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a concert by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the concert.',
  })
  @ApiResponse({ status: 404, description: 'Concert not found.' })
  async findOne(@Param('id') id: string) {
    return this.concertsService.findOne(id);
  }

  @Post('seat-types')
  @ApiOperation({ summary: 'Create a new seat type' })
  @ApiResponse({
    status: 201,
    description: 'The seat type has been successfully created.',
  })
  async createSeatType(@Body() createSeatTypeDto: CreateSeatTypeDto) {
    return this.concertsService.createSeatType(createSeatTypeDto);
  }

  @Get('seat-types')
  @ApiOperation({ summary: 'Get all seat types' })
  @ApiResponse({
    status: 200,
    description: 'Return all seat types.',
  })
  async findAllSeatTypes() {
    return this.concertsService.findAllSeatTypes();
  }

  @Get('seat-types/:id')
  @ApiOperation({ summary: 'Get a seat type by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the seat type.',
  })
  @ApiResponse({ status: 404, description: 'Seat type not found.' })
  async findSeatTypeById(@Param('id') id: string) {
    return this.concertsService.findSeatTypeById(id);
  }
} 