import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: 'doctor';
  provider: 'local' | 'google';
  isVerified: boolean;
  specialty: string;
  phone?: string;
  dob?: Date;
  profileImage?: { data: Buffer; contentType: string };
  rating: number;
  reviewCount: number;
  experience: string;
  hospitalAffiliation: string;
  location: string;
  availableSlots: number;
  nextAvailable: string;
  bio: string;
  qualifications: string[];
  languages: string[];
  createdAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['doctor'], default: 'doctor' },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    isVerified: { type: Boolean, default: false },
    specialty: { type: String, default: '' },
    phone: { type: String, default: '' },
    dob: { type: Date },
    profileImage: {
      data: Buffer,
      contentType: String,
    },
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    experience: { type: String, default: '' },
    hospitalAffiliation: { type: String, default: '' },
    location: { type: String, default: '' },
    availableSlots: { type: Number, default: 0 },
    nextAvailable: { type: String, default: '' },
    bio: { type: String, default: '' },
    qualifications: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: 'doctors',
  }
);

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
