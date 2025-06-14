// File: backend/src/models/Appointment.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  datetime: Date;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  reminder24Sent: boolean;
  reminder1hSent: boolean;
  rated: boolean;

  // patient-provided message/reason
  message?: string;

  // Payment fields
  amount: number; // in smallest unit, e.g., INR rupees
  currency: string; // e.g., 'INR'
  paymentStatus: 'pending' | 'paid' | 'failed';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;

  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    datetime: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'scheduled', 'completed', 'cancelled'], default: 'pending' },
    reminder24Sent: { type: Boolean, default: false },
    reminder1hSent: { type: Boolean, default: false },
    rated: { type: Boolean, default: false },

    message: { type: String, default: '' },

    // Payment details
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
  },
  {
    collection: 'appointments',
    timestamps: true,
  }
);

// Indexing for efficient queries (e.g., upcoming appointments)
AppointmentSchema.index({ doctor: 1, datetime: 1 });
AppointmentSchema.index({ patient: 1, datetime: 1 });

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
