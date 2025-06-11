// File: backend/src/models/Doctor.ts

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

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
  profileImage?: {
    data: Buffer;
    contentType: string;
  };
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

  // Razorpay Connect: stores connected account ID for payouts
  razorpayAccountId?: string;

  // Account management
  isActive: boolean;
  deleteAttempts: number;
  deleteLockedUntil?: Date;

  createdAt: Date;
  updatedAt: Date;

  // Method to compare a plain‐text password to hashed
  comparePassword?: (password: string) => Promise<boolean>;
}

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
    profileImage: {
      data: Buffer,
      contentType: String,
    },

    // Ratings
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },

    // Professional details
    experience: { type: String, default: '' },
    hospitalAffiliation: { type: String, default: '' },
    location: { type: String, default: '' },
    availableSlots: { type: Number, default: 0 },
    nextAvailable: { type: String, default: '' },
    bio: { type: String, default: '' },
    qualifications: { type: [String], default: [] },
    languages: { type: [String], default: [] },

    // Razorpay Connect
    razorpayAccountId: { type: String, default: null },

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
