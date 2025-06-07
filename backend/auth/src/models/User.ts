// File: backend/src/models/User.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  googleId?: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: 'patient' | 'doctor';
  isVerified: boolean;
  provider: 'local' | 'google';
  phone?: string;
  dob?: Date;
  createdAt: Date;

  // NEW: store image binary and its MIME type
  profileImage?: {
    data: Buffer;
    contentType: string;
  };
}

const UserSchema: Schema = new Schema({
  googleId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // only for local signups
  role: { type: String, enum: ['patient', 'doctor'], default: 'patient' },
  isVerified: { type: Boolean, default: false },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  phone: { type: String, default: '' },
  dob: { type: Date },
  createdAt: { type: Date, default: Date.now },

  // NEW FIELD: store image data buffer and MIME type
  profileImage: {
    data: { type: Buffer },
    contentType: { type: String },
  },
});

export default mongoose.model<IUser>('User', UserSchema);
