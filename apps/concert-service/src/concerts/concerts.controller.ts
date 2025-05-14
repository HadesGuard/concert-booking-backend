import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConcertsService } from './concerts.service';
import { CreateConcertDto } from './dto/create-concert.dto';
import { ListConcertsDto } from './dto/list-concerts.dto';
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
  @ApiOperation({ summary: 'Get all available concerts' })
  @ApiResponse({
    status: 200,
    description: 'Return all available concerts with optional filters.',
  })
  async findAll(@Query() query: ListConcertsDto) {
    return this.concertsService.findAll(query);
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
} 