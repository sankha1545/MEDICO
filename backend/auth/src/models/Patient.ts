// File: backend/src/models/Patient.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: 'patient';
  provider: 'local' | 'google';
  isVerified: boolean;
  isActive: boolean;       // NEW: whether the account is active (true) or deactivated (false)
  phone?: string;
  dob?: Date;
  profileImage?: {
    data: Buffer;
    contentType: string;
  };
  createdAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['patient'], default: 'patient' },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }, // NEW
    phone: { type: String, default: '' },
    dob: { type: Date },
    profileImage: {
      data: Buffer,
      contentType: String,
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: 'patients',
  }
);

export default mongoose.model<IPatient>('Patient', PatientSchema);
