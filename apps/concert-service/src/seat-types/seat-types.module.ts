import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeatType, SeatTypeSchema } from './schemas/seat-type.schema';
import { SeatTypeService } from './seat-types.service';
import { redisProvider } from '../redis/redis.provider';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeatType.name, schema: SeatTypeSchema },
    ]),
  ],
  providers: [SeatTypeService, redisProvider],
  exports: [SeatTypeService],
})
export class SeatTypeModule {} 