// File: src/server.js

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import client from 'prom-client';

import chatRouter from './routes/chat.js';
import { initQAStore } from './qaStore.js';

// Load environment variables
dotenv.config();

// Validate required env
const requiredEnvs = ['PORT', 'CORS_ORIGIN', 'JSON_PATH'];
for (const key of requiredEnvs) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// Prometheus Metrics Setup
client.collectDefaultMetrics();
const httpDurationHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});
const chatRequestCounter = new client.Counter({
  name: 'chat_requests_total',
  help: 'Total number of /api/chat requests received',
});

// Rate limiter middleware
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});

async function startServer() {
  // Initialize QA store
  try {
    await initQAStore();
  } catch (err) {
    console.error('❌ Failed to initialize QA store:', err);
    process.exit(1);
  }

  const app = express();
  const PORT = Number(process.env.PORT);

  // Security headers
  app.use(helmet());

  // HTTP request logger
  app.use(morgan('combined'));

  // Rate limiting
  app.use(limiter);

  // CORS
  app.use(cors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  }));

  // Body parser
  app.use(express.json());

  // Prometheus metrics middleware
  app.use((req, res, next) => {
    const endTimer = httpDurationHistogram.startTimer();
    res.on('finish', () => {
      const route = req.route?.path || req.path;
      endTimer({ method: req.method, route, status_code: res.statusCode });
    });
    next();
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'chatbot', timestamp: Date.now() });
  });

  // Chat endpoint with counter
  app.use(
    '/api/chat',
    (req, res, next) => { chatRequestCounter.inc(); next(); },
    chatRouter
  );

  // Metrics endpoint
  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', client.register.contentType);
      res.end(await client.register.metrics());
    } catch (err) {
      res.status(500).end(err.toString());
    }
  });

  // Global error handler
  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  const server = app.listen(PORT, () => {
    console.log(`⚡️ Chatbot backend listening on port ${PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('🚀 Shutting down server...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
