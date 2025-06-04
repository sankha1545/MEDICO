// File: src/index.ts

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { info, error } from "./utils/logger";
import chatRoutes from "./routes/chat";
import { loadFaqDataFromPdf } from "./utils/parser";

dotenv.config();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  })
);

// 1) Load and parse the PDF once, into a global in-memory array
let faqData: { prompt: string; response: string }[] = [];

loadFaqDataFromPdf()
  .then((entries) => {
    faqData = entries;
    info(`Loaded ${entries.length} FAQ entries from PDF.`);
  })
  .catch((err) => {
    error("Failed to load or parse faq.pdf: " + err.message);
    process.exit(1); // cannot proceed without FAQ data
  });

// 2) Make faqData available to routes via simple injection
app.use((req, _res, next) => {
  // attach to req so chatRoutes can access
  ;(req as any).faqData = faqData;
  next();
});

// 3) Mount chat route
app.use("/api/chat", chatRoutes);

app.get("/", (_req, res) => {
  res.send({ status: "Medico FAQ Chatbot Backend is running." });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  info(`Server listening on port ${PORT}`);
});
