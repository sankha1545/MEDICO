// File: backend/src/models/Notification.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;            // e.g. 'appointment_requested', 'payment_received', 'prescription', etc.
  message: string;
  read: boolean;
  fileUrl?: string;        // Optional link to an attached file (e.g., prescription PDF)
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'onModel'
  },
  // If you store notifications for both patients and doctors, you can either:
  //  • use `ref: 'User'` if both share a single User model, or
  //  • use `refPath` plus an 'onModel' field to dynamically reference different collections.
  //
  // Here we assume a single User collection, so you could simplify to `ref: 'User'`.
  //
  // For dynamic reference, uncomment the 'onModel' field below and include it in the schema.
  //
  // onModel: {
  //   type: String,
  //   required: true,
  //   enum: ['Patient', 'Doctor']
  // },
  type: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  fileUrl: { type: String },   // NEW: URL to prescription PDF or other attachment
  createdAt: { type: Date, default: Date.now }
});

// If you’re using a single User model, change refPath above to ref: 'User' and remove refPath.
// Example:
//   userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },

export default mongoose.model<INotification>('Notification', NotificationSchema);
