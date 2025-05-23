import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking, BookingSchema } from '../../common/schemas/booking.schema';
import { HttpModule } from '@nestjs/axios';
import { redisProvider } from '../redis/redis.provider';
import { ServiceAuthService } from '../auth/auth.service';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpClientService } from '../../common/services/http-client.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
    ]),
    HttpModule,
    CacheModule.register({
      ttl: 3600, // 1 hour
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    redisProvider,
    ServiceAuthService,
    HttpClientService,
  ],
  exports: [BookingsService],
})
export class BookingsModule {} 