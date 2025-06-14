// File: backend/src/models/Doctor.ts

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ILocation {
  lat: number;
  lng: number;
  address: string;
}

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

  // Store a URL/path to the uploaded profile image
  profileImageUrl?: string;

  rating: number;
  reviewCount: number;

  experience: string;
  hospitalAffiliation: string;
  // location as free-text or fallback; primary location stored in locationObj
  location: string;
  // structured location
  locationObj?: ILocation;

  // Next available slot
  slotDateTime?: Date;
  // Max patients per slot
  maxPatients: number;

  bio: string;
  qualifications: string[];
  languages: string[];

  // Razorpay Connect
  razorpayAccountId?: string | null;

  consultationFee: number;

  // Soft‐delete & lockout
  isActive: boolean;
  deleteAttempts: number;
  deleteLockedUntil?: Date | null;

  createdAt: Date;
  updatedAt: Date;

  comparePassword?: (password: string) => Promise<boolean>;
}

const LocationSchema = new Schema<ILocation>(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
  },
  { _id: false }
);

const DoctorSchema = new Schema<IDoctor>(
  {
    // Basic profile
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['doctor'], default: 'doctor' },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    isVerified: { type: Boolean, default: false },

    specialty: { type: String, default: '' },
    phone: { type: String, default: '' },
    dob: { type: Date },

    profileImageUrl: { type: String, default: '' },

    // Ratings
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },

    // Professional details
    experience: { type: String, default: '' },
    hospitalAffiliation: { type: String, default: '' },
    location: { type: String, default: '' },
    locationObj: { type: LocationSchema, required: false },

    slotDateTime: { type: Date },
    maxPatients: { type: Number, default: 1 },

    bio: { type: String, default: '' },
    qualifications: { type: [String], default: [] },
    languages: { type: [String], default: [] },

    // Razorpay Connect
    razorpayAccountId: { type: String, default: null },

    // consultation fee in INR
    consultationFee: { type: Number, default: 500 },

    // Soft‐delete & lockout
    isActive: { type: Boolean, default: true },
    deleteAttempts: { type: Number, default: 0 },
    deleteLockedUntil: { type: Date, default: null },
  },
  {
    collection: 'doctors',
    timestamps: true,
  }
);

// Ensure unique email index
DoctorSchema.index({ email: 1 }, { unique: true });

// Strip sensitive data from JSON responses
DoctorSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

// Instance method: compare plain password to this.passwordHash
DoctorSchema.methods.comparePassword = async function (password: string) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
