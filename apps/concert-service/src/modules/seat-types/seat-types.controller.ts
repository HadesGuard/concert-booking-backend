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
import { CreateSeatTypeDto } from '../../common/dto/create-seat-type.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';


@ApiTags('seat-types')
@Controller('concerts/:concertId/seat-types')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SeatTypesController {
  constructor(private readonly seatTypeService: SeatTypeService) {}

  @Post()
  @ApiOperation({ summary: 'Create seat types for a concert' })
  @ApiResponse({
    status: 201,
    description: 'The seat types have been successfully created.',
  })
  async create(
    @Param('concertId') concertId: string,
    @Body() createSeatTypeDto: CreateSeatTypeDto,
  ) {
    return this.seatTypeService.create(concertId, createSeatTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all seat types for a concert' })
  @ApiResponse({
    status: 200,
    description: 'Return all seat types for the concert.',
  })
  async findAll(@Param('concertId') concertId: string) {
    return this.seatTypeService.findAllByConcertId(concertId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a seat type by id for a concert' })
  @ApiResponse({
    status: 200,
    description: 'Return the seat type.',
  })
  @ApiResponse({ status: 404, description: 'Seat type not found.' })
  async findOne(
    @Param('concertId') concertId: string,
    @Param('id') id: string,
  ) {
    return this.seatTypeService.findOneByConcertId(concertId, id);
  }
} 