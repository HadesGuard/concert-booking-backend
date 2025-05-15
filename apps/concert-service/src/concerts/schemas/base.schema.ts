import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema()
export class BaseSchema extends Document {
  @Prop({
    type: String,
    default: () => uuidv4(),
  })
  _id: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
} 