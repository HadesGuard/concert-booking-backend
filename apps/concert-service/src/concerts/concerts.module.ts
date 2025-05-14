import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { Concert, ConcertSchema } from './schemas/concert.schema';
import { ConcertsService } from './concerts.service';
import { ConcertsController } from './concerts.controller';
import { SeatTypeModule } from '../seat-types/seat-types.module';
import { CacheService } from '../common/services/cache.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Concert.name, schema: ConcertSchema },
    ]),
    CacheModule.register({
      ttl: 3600, // 1 hour
      max: 100, // maximum number of items in cache
    }),
    HttpModule,
    SeatTypeModule,
  ],
  controllers: [ConcertsController],
  providers: [ConcertsService, CacheService],
  exports: [ConcertsService],
})
export class ConcertsModule {} 