import { Prop, Schema } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema()
export class BaseSchema {
  @Prop({
    type: String,
    default: () => uuidv4(),
  })
  _id!: string;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}
