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
import paymentsRoutes from './routes/payment';
import notificationsRoutes from './routes/notifications';
import webhookHandler from './routes/Webhook';
import { startNotificationScheduler } from './utils/notificationsScheduler';

dotenv.config();
const app = express();

app.use(helmet());
app.use(morgan('combined'));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
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

app.use('/uploads', express.static(path.join(__dirname, '../uploads'), { maxAge: '7d' }));

const MONGO_URI = process.env.MONGO_URI!;
if (!MONGO_URI) {
  console.error('Error: MONGO_URI not defined');
  process.exit(1);
}
mongoose
  .connect(MONGO_URI, { autoIndex: true })
  .then(() => {
    console.log('MongoDB connected');
    startNotificationScheduler();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Razorpay webhook: raw body
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', authRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
