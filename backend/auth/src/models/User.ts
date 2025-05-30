import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor';
  isVerified: boolean;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },            // hashed
  role: { type: String, enum: ['patient','doctor'], required: true },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

export default model<IUser>('User', userSchema);
