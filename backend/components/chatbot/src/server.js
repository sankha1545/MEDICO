// src/server.js
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const { initQAStore, findBestAnswer } = require('./qaStore');

async function startServer() {
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

  // 3) Chat endpoint
  app.post('/api/chat', (req, res) => {
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
        "Sorry, I can only answer questions about this website’s booking features."
    });
  });

  // 5) Start listening
  const port = parseInt(process.env.PORT, 10) || 8000;
  app.listen(port, () => {
    console.log(`⚡️ Chatbot backend listening on http://localhost:${port}`);
  });
}

startServer();
