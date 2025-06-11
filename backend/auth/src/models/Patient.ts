// File: backend/src/models/Patient.ts

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IPatient extends Document {
  name: string;
  email: string;
  passwordHash?: string;
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
  deleteLockedUntil?: Date;

  // Notification settings:
  notificationSettings: {
    emailAppointments: boolean;
    emailDoctorMessages: boolean;
    emailPromotions: boolean;
    smsAlerts: boolean;
    smsPhone?: string;       // patient’s phone number for SMS
    smsCarrierDomain?: string; // e.g. "txt.att.net"
    inAppNotifications: boolean;
  };

  createdAt: Date;
  updatedAt: Date;

  comparePassword?: (password: string) => Promise<boolean>;
}

const PatientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
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

// Index on email
PatientSchema.index({ email: 1 }, { unique: true });

// toJSON transform: remove sensitive fields
PatientSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

// Instance method to compare password
PatientSchema.methods.comparePassword = async function (password: string) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model<IPatient>('Patient', PatientSchema);
