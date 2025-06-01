// File: index.ts

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import appointmentRoutes from './routes/appointmentRoutes';
import profileRoutes from './routes/profile';

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Routes (after middleware)
app.use('/api/appointments', appointmentRoutes);
app.use('/api/profile', profileRoutes);

// Server + DB Setup
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not set in .env file');
  process.exit(1); // Exit if MONGO_URI is not found
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
