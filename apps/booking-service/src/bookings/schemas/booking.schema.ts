import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@app/common';
import { BookingStatus } from '../enums/booking-status.enum';

export type BookingDocument = Booking & Document;

@Schema({ 
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Booking extends BaseSchema {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  concertId: string;

  @Prop({ required: true, index: true })
  seatTypeId: string;

  @Prop({ 
    type: String, 
    enum: Object.values(BookingStatus),
    default: BookingStatus.ACTIVE,
    index: true,
  })
  status: BookingStatus;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Compound indexes
BookingSchema.index({ userId: 1, concertId: 1, status: 1 });
BookingSchema.index({ concertId: 1, seatTypeId: 1, status: 1 }); 
BookingSchema.index({ userId: 1, concertId: 1 }, { unique: true });
