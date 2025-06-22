// File: backend/src/models/Notification.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;       // e.g. 'appointment_requested', 'payment_received', etc.
  message: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, required: true, refPath: 'onModel' },
  // If you store notifications for both patients and doctors, you can omit refPath or use dynamic ref. 
  // For simplicity, we assume userId can reference either Patient or Doctor.
  type: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
