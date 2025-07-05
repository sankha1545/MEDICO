// File: backend/src/models/Patient.ts

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IPatient extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: 'patient';
  provider: 'local' | 'google';
  isVerified: boolean;
  phone?: string;
  dob?: Date;
  profileImage?: {
    data: Buffer;
    contentType: string;
  };
  isActive: boolean;
  deleteAttempts: number;
  deleteLockedUntil?: Date | null;

  // Notification settings:
  notificationSettings: {
    emailAppointments: boolean;
    emailDoctorMessages: boolean;
    emailPromotions: boolean;
    smsAlerts: boolean;
    smsPhone?: string;
    smsCarrierDomain?: string;
    inAppNotifications: boolean;
  };

  createdAt: Date;
  updatedAt: Date;

  comparePassword(password: string): Promise<boolean>;
}

const PatientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true, // ensures MongoDB enforces uniqueness, triggers 11000 on duplicates
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please fill a valid email address'],
    },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['patient'], default: 'patient' },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    isVerified: { type: Boolean, default: false },
    phone: { type: String, default: '' },
    dob: { type: Date },

    profileImage: {
      data: Buffer,
      contentType: String,
    },

    isActive: { type: Boolean, default: true },
    deleteAttempts: { type: Number, default: 0 },
    deleteLockedUntil: { type: Date, default: null },

    notificationSettings: {
      emailAppointments: { type: Boolean, default: true },
      emailDoctorMessages: { type: Boolean, default: true },
      emailPromotions: { type: Boolean, default: false },
      smsAlerts: { type: Boolean, default: false },
      smsPhone: { type: String, default: '' },
      smsCarrierDomain: { type: String, default: '' },
      inAppNotifications: { type: Boolean, default: true },
    },
  },
  {
    collection: 'patients',
    timestamps: true,
  }
);

// Indexes to enforce uniqueness at the database level
PatientSchema.index({ email: 1 }, { unique: true });
PatientSchema.index({ googleId: 1 }, { unique: true, sparse: true });

// Remove sensitive fields from JSON output
PatientSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    if (ret.profileImage) {
      delete ret.profileImage.data;
    }
    return ret;
  },
});

// Pre-save: hash password if modified and provider is 'local'
PatientSchema.pre<IPatient>('save', async function (next) {
  if (this.isModified('passwordHash') && this.passwordHash) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    } catch (err) {
      return next(err as any);
    }
  }
  next();
});

// Instance method to compare a candidate password against the stored hash
PatientSchema.methods.comparePassword = function (password: string) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model<IPatient>('Patient', PatientSchema);
