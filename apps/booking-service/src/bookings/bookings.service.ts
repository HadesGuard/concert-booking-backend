import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { REDIS_CLIENT } from '../redis/redis.provider';
import Redis from 'ioredis';
import axios from 'axios';

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
    const booking = new this.bookingModel(createBookingDto);
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
} 