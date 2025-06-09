import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: 'patient';
  isVerified: boolean;
  provider: 'local' | 'google';
  phone?: string;
  dob?: Date;
  createdAt: Date;
}

const PatientSchema = new Schema<IPatient>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['patient'], default: 'patient' },
  isVerified: { type: Boolean, default: false },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  phone: { type: String, default: '' },
  dob: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPatient>('Patient', PatientSchema);
