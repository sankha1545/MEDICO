// src/index.ts
import dotenv from 'dotenv';
dotenv.config();              // ← must run before using process.env

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';

const app = express();

// (optional) suppress Mongoose strictQuery warning
mongoose.set('strictQuery', false);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use('/auth', authRoutes);

// Now MONGO_URI is defined
const uri = process.env.MONGO_URI!;
if (!uri) {
  console.error('❌ MONGO_URI is not set in .env');
  process.exit(1);
}

mongoose
  .connect(uri)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(5000, () => console.log('🚀 Server listening on 5000'));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
