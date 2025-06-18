// File: src/models/Doctor.ts

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

  // Profile image binary stored here
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

  // Backward-compatible single next slot (optional)
  slotDateTime?: Date;

  // Multiple availability slots
  availabilitySlots: Date[];

  maxPatients: number;

  bio: string;
  qualifications: string[];
  languages: string[];

  razorpayAccountId?: string | null;
  consultationFee: number;

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
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      // Basic validation for email format
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please fill a valid email address'],
    },
    passwordHash: { type: String },
    role: { type: String, enum: ['doctor'], default: 'doctor' },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    isVerified: { type: Boolean, default: false },

    specialty: { type: String, default: '' },
    phone: { type: String, default: '' },
    dob: { type: Date },

    // Profile image binary
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

    slotDateTime: { type: Date },                    // optional single next slot
    availabilitySlots: { type: [Date], default: [] }, // multiple slots

    maxPatients: { type: Number, default: 1, min: 1 },

    bio: { type: String, default: '' },
    qualifications: { type: [String], default: [] },
    languages: { type: [String], default: [] },

    razorpayAccountId: { type: String, default: null },
    consultationFee: { type: Number, default: 500, min: 0 },

    isActive: { type: Boolean, default: true },
    deleteAttempts: { type: Number, default: 0 },
    deleteLockedUntil: { type: Date, default: null },
  },
  {
    collection: 'doctors',
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Index email
DoctorSchema.index({ email: 1 }, { unique: true });

// Remove sensitive fields when converting to JSON
DoctorSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    // Do not include profileImage.data in JSON responses
    if (ret.profileImage) {
      delete ret.profileImage.data;
    }
    return ret;
  },
});

// Pre-save hook: hash password if modified (assuming passwordHash is set from plain-text password elsewhere)
DoctorSchema.pre<IDoctor>('save', async function (next) {
  // If passwordHash field holds a plain password string? 
  // Usually, you would set passwordHash externally after hashing. 
  // If you want to accept plain password field, you'd handle differently.
  // Here, assume elsewhere you set passwordHash = await bcrypt.hash(password, salt)
  next();
});

// Method: compare plain password to stored hash
DoctorSchema.methods.comparePassword = async function (password: string) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
