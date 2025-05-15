import { Controller, Post, Body, Get, UseGuards, Request, Delete, Param, HttpCode } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @HttpCode(201)
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({ status: 200, description: 'List all bookings' })
  async findAll() {
    return this.bookingsService.findAll();
  }

  @Get('my-bookings')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Get user bookings' })
  @ApiResponse({ status: 200, description: 'List user bookings' })
  async findMyBookings(@Request() req) {
    const userId = req.user.id || req.user.sub;
    return this.bookingsService.findByUser(userId);
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Get booking details' })
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Delete(':concertId')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Cancel a booking for a concert' })
  @ApiResponse({ status: 200, description: 'Booking cancelled and seat released.' })
  async cancelBooking(@Request() req, @Param('concertId') concertId: string) {
    const userId = req.user.id || req.user.sub;
    return this.bookingsService.cancelBooking(userId, concertId);
  }
} 