// File: src/server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Prometheus client
const client = require('prom-client');

const { initQAStore, findBestAnswer } = require('./qaStore');

async function startServer() {
  // ─────────── Prometheus Metrics Setup ───────────
  // 1) Collect default system metrics (CPU, memory, GC, event-loop lag, etc.)
  client.collectDefaultMetrics();

  // 2) HTTP request duration histogram (in seconds)
  const httpDurationHistogram = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  });

  // 3) Chat request counter
  const chatRequestCounter = new client.Counter({
    name: 'chat_requests_total',
    help: 'Total number of /api/chat requests received',
  });

  // ────────────────────────────────────────────────

  // 1) Load & index Q&A
  try {
    initQAStore();
  } catch (err) {
    console.error('❌ Failed to initialize QA store:', err);
    process.exit(1);
  }

  // 2) Express setup
  const app = express();
  app.use(cors());
  app.use(express.json());

  // 4) Middleware to measure every request duration
  app.use((req, res, next) => {
    const endTimer = httpDurationHistogram.startTimer();
    res.on('finish', () => {
      const route = (req.route && req.route.path) || req.path;
      endTimer({ method: req.method, route, status_code: res.statusCode });
    });
    next();
  });

  // 3) Chat endpoint
  app.post('/api/chat', (req, res) => {
    chatRequestCounter.inc(); // increment chat request count

    const { messages } = req.body;
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ answer: 'Invalid payload; messages[] required.' });
    }

    // find last user message
    const lastUser = [...messages]
      .reverse()
      .find((m) => m.role === 'user' && typeof m.content === 'string');

    if (!lastUser) {
      return res.status(400).json({ answer: 'No user question found.' });
    }

    // 4) lookup
    const answer = findBestAnswer(lastUser.content);

    return res.json({
      answer:
        answer ||
        "Sorry, I can only answer questions about this website’s booking features.",
    });
  });

  // ─────────── Expose Prometheus Metrics ───────────
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  });
  // ────────────────────────────────────────────────

  // 5) Start listening
  const port = parseInt(process.env.PORT, 10) || 8000;
  app.listen(port, () => {
    console.log(`⚡️ Chatbot backend listening on http://localhost:${port}`);
  });
}

startServer();
