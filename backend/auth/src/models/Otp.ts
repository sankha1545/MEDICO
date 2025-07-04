import mongoose, { Document, Schema } from 'mongoose';

export type OtpPurpose = 'signup' | 'reset' | 'emailChange';

export interface IOtp extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  purpose: OtpPurpose;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    purpose: {
      type: String,
      enum: ['signup', 'reset', 'emailChange'],
      required: true,
      default: 'signup',
      index: true,
    },
  },
  {
    collection: 'otps',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index: delete documents when expiresAt reached
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for lookup by email+purpose
OtpSchema.index({ email: 1, purpose: 1 });

export default mongoose.model<IOtp>('Otp', OtpSchema);
