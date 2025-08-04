// File: src/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import client from 'prom-client';

import chatRouter from './routes/chat.js';
import { initQAStore } from './qaStore.js';

dotenv.config();

// ─── Prometheus Metrics Setup ────────────────────────
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
// ─────────────────────────────────────────────────────

async function startServer() {
  // Load & index Q&A
  try {
    initQAStore();
  } catch (err) {
    console.error('❌ Failed to initialize QA store:', err);
    process.exit(1);
  }

  const app = express();
  const PORT = parseInt(process.env.PORT, 10) || 8000;

  // ✅ Enable CORS for your frontend
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://medicox123.netlify.app',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  }));

  // ✅ Body parsing
  app.use(express.json());

  // ─── Request Timing Middleware ──────────────────────
  app.use((req, res, next) => {
    const endTimer = httpDurationHistogram.startTimer();
    res.on('finish', () => {
      const route = (req.route && req.route.path) || req.path;
      endTimer({ method: req.method, route, status_code: res.statusCode });
    });
    next();
  });

  // ─── Health Check ───────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'chatbot', timestamp: Date.now() });
  });

  // ─── Mount Chat Router ──────────────────────────────
  // This makes `POST /api/chat` work, since chatRouter defines `router.post('/', ...)`
  app.use('/api/chat', (req, res, next) => {
    chatRequestCounter.inc();
    next();
  }, chatRouter);

  // ─── Prometheus Metrics Endpoint ────────────────────
  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', client.register.contentType);
      res.end(await client.register.metrics());
    } catch (err) {
      res.status(500).end(err.toString());
    }
  });

  // ─── Global Error Handler ───────────────────────────
  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  // ─── Start Server ────────────────────────────────────
  app.listen(PORT, () => {
    console.log(`⚡️ Chatbot backend listening on http://localhost:${PORT}`);
  });
}

startServer();
