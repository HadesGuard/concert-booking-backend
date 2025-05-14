import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@app/common';
import { Role } from '@app/common';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User extends BaseSchema {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ type: [String], enum: Object.values(Role), default: [Role.USER] })
  roles!: Role[];

  @Prop({ type: String, default: null })
  refreshToken?: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
