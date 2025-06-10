// File: backend/src/models/Appointment.ts

import mongoose, { Document, Schema } from 'mongoose';
import { IPatient } from './Patient';

export interface IAppointment extends Document {
  user: mongoose.Types.ObjectId | IPatient;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'pending' | 'confirmed';
  paymentMethod?: 'netbanking' | 'upi' | 'cash';
  paidAt?: Date;
  createdAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed'], default: 'pending' },
    paymentMethod: { type: String, enum: ['netbanking', 'upi', 'cash'] },
    paidAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: 'appointments',
  }
);

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
