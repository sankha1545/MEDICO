// File: backend/src/models/Notification.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  message: string;
  read: boolean;
  fileUrl?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'onModel',
  },
  type: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  fileUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);
