import { BaseSchema } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BookingStatus } from '../enums/booking-status.enum';

@Schema({ timestamps: true })
export class Booking extends BaseSchema {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  concertId: string;

  @Prop({ required: true })
  seatTypeId: string;

  @Prop({ type: String, enum: Object.values(BookingStatus), default: BookingStatus.ACTIVE })
  status: BookingStatus;
}

export const BookingSchema = SchemaFactory.createForClass(Booking); 