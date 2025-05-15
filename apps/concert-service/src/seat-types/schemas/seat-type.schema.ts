import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '../../concerts/schemas/base.schema';

export type SeatTypeDocument = SeatType & Document;

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
export class SeatType extends BaseSchema {
  @Prop({ 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  name: string;

  @Prop({ 
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200,
  })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 1 })
  capacity: number;

  @Prop({ required: true, min: 1 })
  total: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  concertId: string;
}

export const SeatTypeSchema = SchemaFactory.createForClass(SeatType);

// Indexes
SeatTypeSchema.index({ name: 'text', description: 'text' });
SeatTypeSchema.index({ price: 1 }); 