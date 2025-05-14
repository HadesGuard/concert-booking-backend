import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { HttpModule } from '@nestjs/axios';
import { redisProvider } from '../redis/redis.provider';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
    ]),
    HttpModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, redisProvider],
  exports: [BookingsService],
})
export class BookingsModule {} 