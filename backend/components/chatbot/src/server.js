const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initQAStore, findBestAnswer } = require('./qaStore');

function startServer() {
  try {
    initQAStore();
  } catch (err) {
    console.error('❌ Failed to initialize QA store:', err);
    process.exit(1);
  }

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post('/api/chat', (req, res) => {
    const { messages } = req.body;

    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ answer: 'Invalid payload' });
    }

    const lastUser = [...messages].reverse().find(m => m.role === 'user' && m.content);
    if (!lastUser) {
      return res.status(400).json({ answer: 'No user message found' });
    }

    const answer = findBestAnswer(lastUser.content);
    return res.json({
      answer:
        answer ||
        "Sorry, I can only answer questions about this website’s booking features.",
    });
  });

  const port = parseInt(process.env.PORT, 10) || 8000;
  app.listen(port, () => {
    console.log(`⚡️ Chatbot backend listening on http://localhost:${port}`);
  });
}

startServer();
