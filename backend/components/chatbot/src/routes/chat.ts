// File: src/routes/chat.ts

import { Router, Request, Response } from "express";
import similarity from "string-similarity";
import type { ChatRequest, ChatResponse } from "../types/chat";
import { info } from "../utils/logger";
import type { FAQEntry } from "../types/faqEntry";

const router = Router();

router.post(
  "/",
  (req: Request<{}, {}, ChatRequest>, res: Response<ChatResponse>) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ answer: 'Invalid payload: "messages" must be a non-empty array.' });
    }

    const lastRaw = messages[messages.length - 1].content || "";
    const userInput = lastRaw.trim().toLowerCase();
    if (!userInput) {
      return res.status(400).json({ answer: "Empty message." });
    }

    // Retrieve the parsed FAQ data from req
    const faqData = (req as any).faqData as FAQEntry[];

    // Compute fuzzy similarity
    let bestMatch: FAQEntry | null = null;
    let bestScore = 0;
    faqData.forEach((entry) => {
      const promptText = entry.prompt.trim().toLowerCase();
      const score = similarity.compareTwoStrings(promptText, userInput);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    });

    const THRESHOLD = 0.6;
    if (bestMatch && bestScore >= THRESHOLD) {
      info(
        `User asked "${lastRaw}". Best match: "${bestMatch.prompt}" (score=${bestScore.toFixed(
          2
        )}). Returning response.`
      );
      return res.json({ answer: bestMatch.response });
    }

    // If nothing above threshold
    info(
      `User asked "${lastRaw}". No match above threshold (bestScore=${bestScore.toFixed(
        2
      )}).`
    );
    return res.json({
      answer:
        "Sorry, I don’t have an answer for that. Please try rephrasing your question.",
    });
  }
);

export default router;
