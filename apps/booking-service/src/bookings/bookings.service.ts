import { Injectable, BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingStatus } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { REDIS_CLIENT } from '../redis/redis.provider';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '../common/services/http-client.service';
import axios, { AxiosError } from 'axios';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class BookingsService {
  private readonly concertServiceUrl: string;
  private readonly authServiceUrl: string;
  private readonly requestTimeout: number;
  private readonly jwtSecret: string;

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly configService: ConfigService,
    private readonly httpClient: HttpClientService,
  ) {
    this.concertServiceUrl = process.env.CONCERT_SERVICE_URL || 'http://localhost:3002/api/v1';
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api/v1';
    this.requestTimeout = parseInt(process.env.REQUEST_TIMEOUT || '5000', 10);
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key';
  }

  private async fetchWithTimeout(url: string, timeout?: number) {
    try {
      // Generate a service-to-service JWT token
      const token = this.generateServiceToken();
      
      return await axios.get(url, { 
        timeout: timeout || this.requestTimeout,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.code === 'ECONNABORTED') {
          throw new BadRequestException('Service request timed out');
        }
        if (error.response?.status === 404) {
          throw new NotFoundException('Resource not found',`${url}`);
        }
      }
      throw new BadRequestException('Service unavailable', `${url}`);
    }
  }

  private generateServiceToken(): string {
    // Create a JWT token for service-to-service communication
    const payload = {
      sub: 'booking-service',
      roles: ['admin'],
      service: 'booking-service'
    };
    
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '1h' });
  }

  private async validateConcert(concertId: string, seatTypeId: string) {
    const concert = await this.httpClient.get<any>(
      `${this.concertServiceUrl}/concerts/${concertId}`
    );
    
    if (!concert.isActive) {
      throw new BadRequestException('This concert is no longer available for booking');
    }

    // Check if seatTypeId exists in the concert's seatTypes array
    const seatTypeExists = concert.seatTypes.includes(seatTypeId);
    if (!seatTypeExists) {
      throw new BadRequestException(
        'Seat type not found',
        `Seat type ${seatTypeId} is not available for concert ${concertId}. Available seat types: ${concert.seatTypes.join(', ')}`
      );
    }

    // Get seat type details from concert service
    const seatTypeDetails = await this.httpClient.get<any>(
      `${this.concertServiceUrl}/concerts/${concertId}/seat-types/${seatTypeId}`
    );

    if (seatTypeDetails.capacity <= 0) {
      throw new BadRequestException(
        'No tickets left for this seat type',
        `Seat type ${seatTypeId} has no available seats for concert ${concertId}`
      );
    }

    return { concert, seatType: seatTypeDetails };
  }

  private async checkSeatAvailability(concertId: string, seatTypeId: string): Promise<number> {
    const redisKey = `concert:${concertId}:seatType:${seatTypeId}:available`;
    const luaScript = `
      local available = tonumber(redis.call('get', KEYS[1]))
      if not available or available <= 0 then
        return -1
      end
      redis.call('decr', KEYS[1])
      return available - 1
    `;
    
    try {
      const result = await this.redisClient.eval(luaScript, 1, redisKey);
      if (result === -1) {
        throw new BadRequestException('No tickets left for this seat type (atomic check)');
      }
      return Number(result);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to check seat availability');
    }
  }

  private async publishBookingEvent(type: string, data: any) {
    try {
      await this.redisClient.publish('booking-events', JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      // Silent fail for event publishing
    }
  }

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // Check for duplicate booking
    const existing = await this.bookingModel.findOne({
      userId: createBookingDto.userId,
      concertId: createBookingDto.concertId,
      status: BookingStatus.ACTIVE,
    });
    if (existing) {
      throw new BadRequestException('User has already booked this concert');
    }

    // Validate concert and seat availability
    await this.validateConcert(createBookingDto.concertId, createBookingDto.seatTypeId);
    await this.checkSeatAvailability(createBookingDto.concertId, createBookingDto.seatTypeId);

    // Create booking
    const booking = new this.bookingModel({
      ...createBookingDto,
      status: BookingStatus.ACTIVE,
    });
    const savedBooking = await booking.save();

    // Fetch user email from auth-service
    let userEmail = null;
    try {
      const userRes = await this.fetchWithTimeout(
        `${this.authServiceUrl}/users/${createBookingDto.userId}`
      );
      userEmail = userRes.data.email;
    } catch (error) {
      // Silent fail for email fetching
    }

    // Publish booking.created event
    await this.publishBookingEvent('booking.created', {
      bookingId: savedBooking._id,
      userId: savedBooking.userId,
      concertId: savedBooking.concertId,
      seatTypeId: savedBooking.seatTypeId,
      email: userEmail,
    });

    return savedBooking;
  }

  async findAll(): Promise<Booking[]> {
    return this.bookingModel.find().exec();
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async findByUser(userId: string): Promise<Booking[]> {
    return this.bookingModel.find({ userId }).exec();
  }

  async cancelBooking(userId: string, concertId: string): Promise<{ success: boolean; message: string }> {
    // Find the booking
    const booking = await this.bookingModel.findOne({ 
      userId, 
      concertId,
      status: BookingStatus.ACTIVE,
    });
    if (!booking) {
      throw new NotFoundException('No active booking found for this user and concert');
    }

    // Update booking status
    booking.status = BookingStatus.CANCELLED;
    await booking.save();

    // Increment seat count in Redis
    try {
      const redisKey = `concert:${booking.concertId}:seatType:${booking.seatTypeId}:available`;
      await this.redisClient.incr(redisKey);
    } catch (error) {
      // Silent fail for seat count increment
    }

    // Publish booking.cancelled event
    await this.publishBookingEvent('booking.cancelled', {
      bookingId: booking._id,
      userId: booking.userId,
      concertId: booking.concertId,
      seatTypeId: booking.seatTypeId,
    });

    return { success: true, message: 'Booking cancelled and seat released.' };
  }
} 