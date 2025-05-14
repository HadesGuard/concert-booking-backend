import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Booking extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  concertId: string;

  @Prop({ required: true })
  seatTypeId: string;

  @Prop({ default: 'active' })
  status: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking); 