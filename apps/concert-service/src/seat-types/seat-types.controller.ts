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
import { SeatTypeService } from './seat-types.service';
import { CreateSeatTypeDto } from './dto/create-seat-type.dto';
import { JwtAuthGuard } from '@app/common';

@ApiTags('seat-types')
@Controller('seat-types')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SeatTypesController {
  constructor(private readonly seatTypeService: SeatTypeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new seat type' })
  @ApiResponse({
    status: 201,
    description: 'The seat type has been successfully created.',
  })
  async create(@Body() createSeatTypeDto: CreateSeatTypeDto) {
    return this.seatTypeService.create(createSeatTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all seat types' })
  @ApiResponse({
    status: 200,
    description: 'Return all seat types.',
  })
  async findAll() {
    return this.seatTypeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a seat type by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the seat type.',
  })
  @ApiResponse({ status: 404, description: 'Seat type not found.' })
  async findOne(@Param('id') id: string) {
    return this.seatTypeService.findOne(id);
  }
} 