import { Controller, Post, Body, Get, UseGuards, Request, Delete, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard, RolesGuard, Roles, Role } from '@app/common';
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

  @Delete(':concertId')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Cancel a booking for a concert' })
  @ApiResponse({ status: 200, description: 'Booking cancelled and seat released.' })
  async cancelBooking(@Request() req, @Param('concertId') concertId: string) {
    // userId from JWT (req.user.id or req.user.sub)
    const userId = req.user.id || req.user.sub;
    return this.bookingsService.cancelBooking(userId, concertId);
  }
} 