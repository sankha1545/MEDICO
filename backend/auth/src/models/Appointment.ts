// File: backend/src/models/Appointment.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  datetime: Date;
  amount: number;
  currency: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  message?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  isSlotActive: boolean;
}

const AppointmentSchema = new Schema<IAppointment>({
  patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  datetime: { type: Date, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'INR' },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled'],
    default: 'pending',
  },
  message: { type: String, default: '' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  isSlotActive: {
  type: Boolean,
  default: true, // new appointments are active
},

});
// In models/Appointment.ts


export default mongoose.model<IAppointment>(
  'Appointment',
  AppointmentSchema
);
