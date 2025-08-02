// File: src/server.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const contactRoutes = require('./routes/contactRoutes');

// Prometheus client
const client = require('prom-client');

dotenv.config();

const app = express();

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

// 3) Contact submissions counter
const contactRequestCounter = new client.Counter({
  name: 'contact_requests_total',
  help: 'Total number of /api/contact requests received',
});
// ────────────────────────────────────────────────

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 4) Middleware to measure every request duration
app.use((req, res, next) => {
  const endTimer = httpDurationHistogram.startTimer();
  res.on('finish', () => {
    const route = (req.route && req.route.path) || req.path;
    endTimer({ method: req.method, route, status_code: res.statusCode });
  });
  next();
});

// Routes
app.use('/api', (req, res, next) => {
  // increment contact counter on every call to /api/contact
  contactRequestCounter.inc();
  next();
}, contactRoutes);

// Default Route
app.get('/', (req, res) => {
  res.send('Welcome to the Contact Form API');
});

// ─────────── Expose Prometheus Metrics ───────────
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
// ────────────────────────────────────────────────

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
