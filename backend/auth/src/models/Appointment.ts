// File: backend/src/models/Appointment.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  datetime: Date;
  status: 'scheduled' | 'completed' | 'cancelled' | string;
  reminder24Sent: boolean;
  reminder1hSent: boolean;
  rated: boolean;
  // ... any other fields ...
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    datetime: { type: Date, required: true },
    status: { type: String, default: 'scheduled' },
    reminder24Sent: { type: Boolean, default: false },
    reminder1hSent: { type: Boolean, default: false },
    rated: { type: Boolean, default: false },
    // ... other fields ...
  },
  {
    collection: 'appointments',
    timestamps: true,
  }
);

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
