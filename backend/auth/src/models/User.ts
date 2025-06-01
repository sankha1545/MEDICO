import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  googleId?: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: 'patient' | 'doctor';
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  googleId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // password only for email signups
  role: { type: String, enum: ['patient', 'doctor'], default: 'patient' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);
