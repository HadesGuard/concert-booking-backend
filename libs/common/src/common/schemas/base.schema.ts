import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class BaseSchema {
  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
} 