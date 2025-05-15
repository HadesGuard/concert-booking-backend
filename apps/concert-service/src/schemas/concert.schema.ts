import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from './base.schema';

export type ConcertDocument = Concert & Document;

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
export class Concert extends BaseSchema {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, trim: true })
  artist: string;

  @Prop({ required: true, trim: true })
  venue: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ 
    type: [String],
    required: true,
  })
  seatTypes: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const ConcertSchema = SchemaFactory.createForClass(Concert);

// Indexes
ConcertSchema.index({ name: 'text', description: 'text', artist: 'text', venue: 'text' });
ConcertSchema.index({ startTime: 1 });
ConcertSchema.index({ seatTypes: 1 }); 