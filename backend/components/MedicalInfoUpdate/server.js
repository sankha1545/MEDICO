// File: backend/src/server.ts
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import userRoutes from './routes/userRoutes';
// … any other imports (authRoutes, appointmentRoutes, etc.) …

const app = express();

// 1) JSON parser
app.use(express.json());

// 2) Serve uploads/ statically at /uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 3) Mount userRoutes
app.use('/api/users', userRoutes);

// 4) …you may have other routes like /api/auth, /api/appointments, etc. …

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/yourDB')
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));
