// File: backend/src/models/Payment.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  orderId: string;
  paymentId?: string;
  appointmentId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  amount: number; // in rupees
  currency: string;
  status: 'created' | 'captured' | 'failed';
  receipt?: string;
  createdAt: Date;
  rawPayload: any;
}

const PaymentSchema = new Schema<IPayment>({
  orderId: { type: String, required: true, index: true },
  paymentId: { type: String },
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'INR' },
  status: { type: String, required: true, enum: ['created', 'captured', 'failed'] },
  receipt: { type: String },
  createdAt: { type: Date, default: Date.now },
  rawPayload: { type: Schema.Types.Mixed },
});

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
