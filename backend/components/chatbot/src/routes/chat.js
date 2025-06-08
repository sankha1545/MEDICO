import express from 'express';
import { findBestAnswer } from '../qaStore.js';

const router = express.Router();

router.post('/', (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ answer: 'Invalid payload' });
  }

  // Get last user message
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser || !lastUser.content) {
    return res.status(400).json({ answer: 'No user question found' });
  }

  const userQ = lastUser.content;
  const result = findBestAnswer(userQ);

  if (result) {
    return res.json({ answer: result.answer });
  } else {
    return res.json({
      answer: "Sorry, I can only answer questions about this website’s booking features."
    });
  }
});

export default router;
