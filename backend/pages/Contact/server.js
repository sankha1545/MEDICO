// File: src/server.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const contactRoutes = require('./routes/contactRoutes');  // ensure this file is named contactRoutes.js

// Prometheus client
const client = require('prom-client');

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

const contactRequestCounter = new client.Counter({
  name: 'contact_requests_total',
  help: 'Total number of contact form requests received',
});
// ────────────────────────────────────────────────

// Connect to MongoDB
connectDB();

// Global middleware
app.use(cors());             // enable CORS (you can lock this down to your Netlify origin)
app.use(bodyParser.json());  // parse JSON bodies

// Timing middleware
app.use((req, res, next) => {
  const endTimer = httpDurationHistogram.startTimer();
  res.on('finish', () => {
    const route = (req.route && req.route.path) || req.path;
    endTimer({ method: req.method, route, status_code: res.statusCode });
  });
  next();
});

// Mount contact routes in two places for compatibility:
['/api/contact', '/contact/api'].forEach((mountPath) => {
  app.use(
    mountPath,
    (req, res, next) => {
      contactRequestCounter.inc();
      next();
    },
    contactRoutes
  );
});

// Health check
app.get('/', (_req, res) => {
  res.send('Welcome to the Contact Form API');
});

// Expose Prometheus metrics
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
