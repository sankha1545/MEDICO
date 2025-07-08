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
import crypto from 'crypto';

// Routes
import authRoutes from './routes/auth';
import medicalRoutes from './routes/medical';
import appointmentRoutes from './routes/appointment';
import paymentsRoutes from './routes/payment';
import notificationsRoutes from './routes/notifications';
import webhookHandler from './routes/Webhook';
import { startNotificationScheduler } from './utils/notificationsScheduler';

dotenv.config();
const app = express();

// --- 1. Generate nonce for CSP per request ---
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  next();
});

// --- 2. Helmet with CSP and other security headers ---
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          (req, res) => `'nonce-${res.locals.nonce}'`,
          'https://accounts.google.com',
          'https://accounts.gstatic.com',
          'https://apis.google.com',
        ],
        frameSrc: ["'self'", 'https://accounts.google.com', 'https://*.google.com'],
        connectSrc: ["'self'", 'https://www.googleapis.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginEmbedderPolicy: false,
  })
);

// --- 3. Logging ---
app.use(morgan('combined'));

// --- 4. CORS: allow frontend origin, methods, and headers for multipart + auth ---
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// --- 5. Session (for Passport, if needed) ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

// --- 6. Body parsers ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 7. Passport initialization ---
app.use(passport.initialize());
app.use(passport.session());

// --- 8. Static file serving for uploads ---
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), { maxAge: '7d' })
);

// --- MongoDB Connection ---
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined');
  process.exit(1);
}
mongoose
  .connect(MONGO_URI, { autoIndex: true })
  .then(() => {
    console.log('✅ MongoDB connected');
    startNotificationScheduler();
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- Routes ---

// 9. Razorpay webhook needs raw body
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

// 10. Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/notifications', notificationsRoutes);

// 11. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 12. Chrome DevTools preflight ping
app.use('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
  res.sendStatus(204);
});

// 13. 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

// 14. Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Unhandled Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

// 15. Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
