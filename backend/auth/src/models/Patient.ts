// File: backend/src/models/Patient.ts

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IPatient extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  password?: string; 
   _password?: string;// virtual plain password
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
  profileImageUrl?: string; // virtual
}

const PatientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 🔑 Virtual password field (not saved)
PatientSchema.virtual('password')
  .set(function (this: IPatient, password: string) {
    this._password = password;
  })
  .get(function (this: IPatient) {
    return this._password;
  });


// 🔒 Pre-save hash logic — only hash `password` (not passwordHash)
PatientSchema.pre<IPatient>('save', async function (next) {
  try {
    if (this.isModified('password') && this.password) {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (err) {
    next(err as any);
  }
});

// 🧠 Add method to compare password input to stored hash
PatientSchema.methods.comparePassword = function (password: string) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(password, this.passwordHash);
};

// 📷 Avatar URL virtual
PatientSchema.virtual('profileImageUrl').get(function (this: IPatient) {
  if (this.profileImage && this._id) {
    return `/api/patients/${this._id}/avatar`;
  }
  return undefined;
});

// 🧼 Strip sensitive fields
PatientSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    if (ret.profileImage) delete ret.profileImage.data;
    return ret;
  },
  virtuals: true,
});

// Indexes
PatientSchema.index({ email: 1 }, { unique: true });
PatientSchema.index({ googleId: 1 }, { unique: true, sparse: true });

export default mongoose.model<IPatient>('Patient', PatientSchema);
