import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: 'doctor';
  specialty?: string;
  isVerified: boolean;
  provider: 'local' | 'google';
  phone?: string;
  dob?: Date;
  createdAt: Date;
  profileImage?: {
    data: Buffer;
    contentType: string;
  };
}

const DoctorSchema = new Schema<IDoctor>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['doctor'], default: 'doctor' },
  specialty: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  phone: { type: String, default: '' },
  dob: { type: Date },
  createdAt: { type: Date, default: Date.now },
  profileImage: {
    data: { type: Buffer },
    contentType: { type: String },
  },
});

// TTL index for profileImage if needed, etc.
export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
