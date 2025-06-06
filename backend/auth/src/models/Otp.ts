// File: backend/src/models/Otp.ts
import { Schema, model, Document } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  code: string;
  expiresAt: Date;
}

const otpSchema = new Schema<IOtp>({
  email: { type: String, required: true, index: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

// Auto-delete OTP docs once expiresAt is passed
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model<IOtp>('Otp', otpSchema);
