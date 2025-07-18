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
  passwordHash: string;
  googleId?: string;
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
  location: string;           // human-readable address
  locationObj?: ILocation;    // geodata

  slotDateTime?: Date;
  availabilitySlots: Date[];
  maxPatients: number;

  bio: string;
  qualifications: string[];
  languages: string[];

  razorpayContactId?: string | null;
  razorpayFundAccountId?: string | null;

  consultationFee: number;

  isActive: boolean;
  deleteAttempts: number;
  deleteLockedUntil?: Date | null;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(password: string): Promise<boolean>;
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
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please fill a valid email address'],
    },
    passwordHash: { type: String, required: true },
    googleId: { type: String, unique: true, sparse: true },
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

    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },

    experience: { type: String, default: '' },
    hospitalAffiliation: { type: String, default: '' },
    location: { type: String, default: '' },
    locationObj: { type: LocationSchema, required: false },

    slotDateTime: { type: Date },
availabilitySlots: Array<{
  datetime: Date;
  quantity: number;
}>  ,


    maxPatients: { type: Number, default: 1, min: 1 },

    bio: { type: String, default: '' },
    qualifications: { type: [String], default: [] },
    languages: { type: [String], default: [] },

    razorpayContactId: { type: String, default: null },
    razorpayFundAccountId: { type: String, default: null },

    consultationFee: { type: Number, default: 500, min: 0 },

    isActive: { type: Boolean, default: true },
    deleteAttempts: { type: Number, default: 0 },
    deleteLockedUntil: { type: Date, default: null },
  },
  {
    collection: 'doctors',
    timestamps: true,
  }
);

// Indexes to prevent duplicate emails (triggers 11000 error code on insert/update)
DoctorSchema.index({ email: 1 }, { unique: true });
DoctorSchema.index({ googleId: 1 }, { unique: true, sparse: true });

// Remove sensitive fields from JSON output
DoctorSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    if (ret.profileImage) {
      delete ret.profileImage.data;
    }
    return ret;
  },
});

// Pre-save hook: hash raw password exactly once
DoctorSchema.pre<IDoctor>('save', async function (next) {
  if (this.isModified('passwordHash') && this.passwordHash) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
  next();
});

// Instance method to compare a candidate password against the stored hash
DoctorSchema.methods.comparePassword = function (candidate: string) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.passwordHash);
};

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
