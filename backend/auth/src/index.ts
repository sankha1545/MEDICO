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

// Prometheus client
import client from 'prom-client';

// Routes
import authRoutes from './routes/auth';
import medicalRoutes from './routes/medical';
import appointmentRoutes from './routes/appointment';
import paymentsRoutes from './routes/payment';
import notificationsRoutes from './routes/notifications';
import webhookHandler from './routes/Webhook';
import doctorRoutes from './routes/Doctor';
import medicalinfoRouter from './routes/medicalinfo';
import { startNotificationScheduler } from './utils/notificationsScheduler';

dotenv.config();
const app = express();

// ─────────── Prometheus Metrics Setup ───────────
client.collectDefaultMetrics();
const httpDurationHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});
const loginCounter = new client.Counter({
  name: 'auth_login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['result'],
});
// Measure request durations
app.use((req, res, next) => {
  const end = httpDurationHistogram.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
  });
  next();
});
// ────────────────────────────────────────────────

app.get('/', (_req, res) => res.send('Medico API is running 🚀'));

// Generate CSP nonce per request
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Helmet security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", (req: Request, res: Response) => `'nonce-${res.locals.nonce}'`, 'https://accounts.google.com', 'https://accounts.gstatic.com', 'https://apis.google.com'],
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
/*----------------------------------------------------------------*/
app.use('/api/auth/google', (req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
/*------------------------------------------------------------------*/ 
// Logging
app.use(morgan('combined'));

// CORS setup - allow both production and Netlify frontend
const allowedOrigins = [
  'https://medicox123.netlify.app',
  process.env.FRONTEND_URL || 'https://medicox.ddns.net',
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Session for Passport (if needed)
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

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Additional routers
app.use('/api/medicalinfo', medicalinfoRouter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), { maxAge: '7d' }));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI not defined');
  process.exit(1);
}
mongoose
  .connect(MONGO_URI, { autoIndex: true })
  .then(() => {
    console.log('✅ MongoDB connected');
    startNotificationScheduler();
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Webhook (raw body)
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), webhookHandler);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/doctor', doctorRoutes);
// Consider removing one of the duplicate doctor mounts below
 app.use('/api/medical/doctor', doctorRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Chrome DevTools preflight ping
app.use('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => res.sendStatus(204));

// 404 handler
app.use((req: Request, res: Response) => res.status(404).json({ message: 'Not Found' }));

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Unhandled Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Prometheus metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
