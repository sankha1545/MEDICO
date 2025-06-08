// File: backend/src/models/ProfileImage.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IProfileImage extends Document {
  user: mongoose.Types.ObjectId;
  data: Buffer;
  contentType: string;
}

const ProfileImageSchema: Schema = new Schema<IProfileImage>({
  user: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
});

export default mongoose.model<IProfileImage>('ProfileImage', ProfileImageSchema);
