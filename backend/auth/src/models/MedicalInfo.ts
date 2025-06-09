// File: backend/src/models/MedicalInfo.ts

import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './Patient';

export interface IMedicalInfo extends Document {
  user: IUser['_id'];
  bloodType: string;
  allergies: string;
  currentMedications: string;
  medicalConditions: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalInfoSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One-to-one: each user has exactly one medical-info document
    },
    bloodType: { type: String, default: '' },
    allergies: { type: String, default: '' },
    currentMedications: { type: String, default: '' },
    medicalConditions: { type: String, default: '' },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

export default mongoose.model<IMedicalInfo>('MedicalInfo', MedicalInfoSchema);
