import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeatType, SeatTypeSchema } from './schemas/seat-type.schema';
import { SeatTypeService } from './seat-types.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeatType.name, schema: SeatTypeSchema },
    ]),
  ],
  providers: [SeatTypeService],
  exports: [SeatTypeService],
})
export class SeatTypeModule {} 