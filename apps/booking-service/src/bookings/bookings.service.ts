import { Injectable, BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { REDIS_CLIENT } from '../redis/redis.provider';
import Redis from 'ioredis';
import axios from 'axios';
import { BookingStatus } from './enums/booking-status.enum';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // Kiểm tra duplicate booking
    const existing = await this.bookingModel.findOne({
      userId: createBookingDto.userId,
      concertId: createBookingDto.concertId,
      status: BookingStatus.ACTIVE,
    });
    if (existing) {
      throw new BadRequestException('User has already booked this concert');
    }

    // Gọi concert-service để kiểm tra seatType còn vé không
    const concertServiceUrl = process.env.CONCERT_SERVICE_URL || 'http://localhost:3001';
    const concertId = createBookingDto.concertId;
    const seatTypeId = createBookingDto.seatTypeId;
    let concert;
    try {
      const res = await axios.get(`${concertServiceUrl}/concerts/${concertId}`);
      concert = res.data;
    } catch (err) {
      throw new BadRequestException('Concert not found or concert-service unavailable');
    }
    const seatType = concert.seatTypes.find((s) => s.id === seatTypeId || s._id === seatTypeId);
    if (!seatType) {
      throw new BadRequestException('Seat type not found');
    }
    if (seatType.availableSeats <= 0) {
      throw new BadRequestException('No tickets left for this seat type');
    }

    // Redis Lua script để giảm số vé atomic
    const redisKey = `concert:${concertId}:seatType:${seatTypeId}:available`;
    const luaScript = `
      local available = tonumber(redis.call('get', KEYS[1]))
      if not available or available <= 0 then
        return -1
      end
      redis.call('decr', KEYS[1])
      return available - 1
    `;
    const result = await this.redisClient.eval(luaScript, 1, redisKey);
    if (result === -1) {
      throw new BadRequestException('No tickets left for this seat type (atomic check)');
    }

    // Nếu thành công, tạo booking
    const booking = new this.bookingModel({
      ...createBookingDto,
      status: BookingStatus.ACTIVE,
    });
    const savedBooking = await booking.save();

    // Fetch user email from auth-service
    let userEmail = null;
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3000';
      const userRes = await axios.get(`${authServiceUrl}/users/${createBookingDto.userId}`);
      userEmail = userRes.data.email;
    } catch (err) {
      console.warn('[BOOKING] Could not fetch user email from auth-service:', err?.response?.data || err.message);
    }

    // Publish booking.created event to Redis
    await this.redisClient.publish('booking-events', JSON.stringify({
      type: 'booking.created',
      data: {
        bookingId: savedBooking._id,
        userId: savedBooking.userId,
        concertId: savedBooking.concertId,
        seatTypeId: savedBooking.seatTypeId,
        email: userEmail,
      }
    }));

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

    // Update booking status instead of deleting
    booking.status = BookingStatus.CANCELLED;
    await booking.save();

    // Increment seat count in Redis
    const redisKey = `concert:${booking.concertId}:seatType:${booking.seatTypeId}:available`;
    await this.redisClient.incr(redisKey);

    // Publish booking.cancelled event to Redis for notification-service
    await this.redisClient.publish('booking-events', JSON.stringify({
      type: 'booking.cancelled',
      data: {
        bookingId: booking._id,
        userId: booking.userId,
        concertId: booking.concertId,
        seatTypeId: booking.seatTypeId,
      }
    }));

    return { success: true, message: 'Booking cancelled and seat released.' };
  }
} 