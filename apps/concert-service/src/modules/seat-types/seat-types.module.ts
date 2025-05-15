import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeatTypeService } from './seat-types.service';
import { redisProvider } from '../redis/redis.provider';
import { SeatType, SeatTypeSchema } from '../../schemas/seat-type.schema';

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