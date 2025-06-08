// File: backend/src/models/User.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  profileImageUrl?: string; // e.g. "/uploads/62f1abcde1234.jpg"
  // …any other fields…
}

const userSchema = new Schema<IUser>(
  {
    name:            { type: String, required: true },
    email:           { type: String, required: true, unique: true },
    password:        { type: String, required: true },
    profileImageUrl: { type: String, default: '' },
    // …other fields…
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
