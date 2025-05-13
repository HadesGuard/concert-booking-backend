import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@app/common';

export type SeatTypeDocument = SeatType & Document;

@Schema({ timestamps: true })
export class SeatType extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  capacity: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const SeatTypeSchema = SchemaFactory.createForClass(SeatType); 