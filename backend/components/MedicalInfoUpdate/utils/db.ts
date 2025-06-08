// File: backend/src/utils/db.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('MONGO_URI is not defined in environment variables');
}

/**
 * Establishes a connection to MongoDB using Mongoose.
 * Logs success or error to the console.
 */
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI, {
      // These options are recommended to avoid deprecation warnings
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);

    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
