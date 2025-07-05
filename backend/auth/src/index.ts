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

// --- Middleware Setup ---

// 1. Generate nonce for CSP per request
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  next();
});

// 2. Helmet with dynamic CSP using the nonce, allowing GSI scripts and popups
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          // allow inline scripts with per-request nonce
          (req, res) => `'nonce-${res.locals.nonce}'`,
          // allow Google Identity Services scripts
          'https://accounts.google.com',
          'https://accounts.gstatic.com',
          'https://apis.google.com',
        ],
        frameSrc: [
          "'self'",
          // allow Google Identity Services iframe origin
          'https://accounts.google.com',
          'https://*.google.com',
        ],
        connectSrc: ["'self'", 'https://www.googleapis.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' },
    // Set Cross-Origin-Opener-Policy to allow popups to close themselves
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    // Disable COEP if previously set; allow embedding if needed
    crossOriginEmbedderPolicy: false,
  })
);

// 3. Logging
app.use(morgan('combined'));

// 4. CORS: allow frontend origin
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// 5. Session (for Passport; though JWT used, session init is needed for passport middleware)
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

// 6. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 7. Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// 8. Static files
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

// Razorpay webhook: raw body
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle Chrome DevTools preflight ping
app.use('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
  res.sendStatus(204);
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Unhandled Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));