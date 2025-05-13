import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@app/common';

export type ConcertDocument = Concert & Document;

@Schema({ timestamps: true })
export class Concert extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  artist: string;

  @Prop({ required: true })
  venue: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ type: [{ type: String }] })
  seatTypes: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const ConcertSchema = SchemaFactory.createForClass(Concert); 