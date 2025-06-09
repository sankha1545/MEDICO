import mongoose, { Document, Schema } from 'mongoose';
import { IPatient } from './Patient';

export interface IMedicalInfo extends Document {
  user: IPatient['_id'];
  bloodType: string;
  allergies: string;
  currentMedications: string;
  medicalConditions: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalInfoSchema = new Schema<IMedicalInfo>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      unique: true, // one record per user
    },
    bloodType: { type: String, default: '' },
    allergies: { type: String, default: '' },
    currentMedications: { type: String, default: '' },
    medicalConditions: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'medicalinfos',
  }
);

export default mongoose.model<IMedicalInfo>('MedicalInfo', MedicalInfoSchema);
