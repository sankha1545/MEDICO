// File: backend/src/models/Appointment.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  datetime: Date;
  status: 'pending_payment' | 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'failed';
  reminder24Sent: boolean;
  reminder1hSent: boolean;
  rated: boolean;

  message?: string;

  // Payment fields
  amount: number; // in rupees
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
    status: {
      type: String,
      enum: ['pending_payment', 'pending', 'scheduled', 'completed', 'cancelled', 'failed'],
      default: 'pending_payment',
    },
    reminder24Sent: { type: Boolean, default: false },
    reminder1hSent: { type: Boolean, default: false },
    rated: { type: Boolean, default: false },

    message: { type: String, default: '' },

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

AppointmentSchema.index({ doctor: 1, datetime: 1 });
AppointmentSchema.index({ patient: 1, datetime: 1 });

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
