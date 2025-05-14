import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@app/common';
import { Role } from '@app/common';

export type UserDocument = User & Document;

@Schema({ 
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret.password;
      delete ret.refreshToken;
      return ret;
    },
  },
})
export class User extends BaseSchema {
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
  name!: string;

  @Prop({ 
    required: true, 
    unique: true, 
    trim: true,
    lowercase: true,
  })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ 
    type: [String], 
    enum: Object.values(Role), 
    default: [Role.USER],
  })
  roles!: Role[];

  @Prop({ type: String, default: null, select: false })
  refreshToken?: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
