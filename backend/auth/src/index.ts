// File: backend/src/index.ts

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth';
import medicalRoutes from './routes/medical';
import appointmentRoutes from './routes/appointment';
import { startNotificationScheduler } from './utils/notificationsScheduler';

dotenv.config();
const app = express();

// -------- Security and logging middleware --------
app.use(helmet());
app.use(morgan('combined'));

// -------- CORS --------
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// -------- Body parsers --------
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for form submissions

// -------- Session & Passport (for OAuth, if used) --------
app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'yoursecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// -------- Static uploads folder --------
// Serve uploaded profile images or other static files
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    // optional: set cache control headers
    maxAge: '7d',
  })
);

// -------- MongoDB connection --------
const MONGO_URI = process.env.MONGO_URI!;
if (!MONGO_URI) {
  console.error('Error: MONGO_URI not defined in environment');
  process.exit(1);
}
mongoose
  .connect(MONGO_URI, { autoIndex: true })
  .then(() => {
    console.log('MongoDB connected');
    // Start any background schedulers after DB is ready
    startNotificationScheduler();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// -------- Routes mounting --------
// Auth routes (signup, login, OAuth callbacks, etc.)
app.use('/api', authRoutes);

// Medical routes (doctor listing, profile, etc.)
app.use('/api/medical', medicalRoutes);

// Appointment routes (booking, listing, etc.)
app.use('/api/appointments', appointmentRoutes);

// -------- Health check endpoint --------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// -------- 404 handler --------
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

// -------- Error-handling middleware --------
app.use(
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    const status = err.status || 500;
    const message =
      err.message || 'Internal Server Error';
    res.status(status).json({ message });
  }
);

// -------- Start server --------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
