// File: src/utils/parser.ts

import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { FAQEntry } from "../types/faqEntry";

/**
 * Load the PDF, split it into lines, then convert any line ending with "?"
 * into a prompt. Everything until the next "?" line becomes that prompt's response.
 */
export async function loadFaqDataFromPdf(): Promise<FAQEntry[]> {
  // 1) Locate the PDF in data/faq.pdf (adjust if your PDF is elsewhere)
  const pdfPath = path.join(__dirname, "../../data/faq.pdf");
  const dataBuffer = fs.readFileSync(pdfPath);

  // 2) Extract raw text
  const pdfData = await pdfParse(dataBuffer);
  const rawText = pdfData.text;

  // 3) Split into individual lines (preserve order)
  const allLines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const faqEntries: FAQEntry[] = [];
  let currentPrompt: string | null = null;
  let currentAnswerLines: string[] = [];

  // 4) Iterate line by line
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];

    // If the line ends with "?", treat it as a new prompt
    if (line.endsWith("?")) {
      // If we were collecting an answer for a previous prompt, finalize it
      if (currentPrompt !== null) {
        const response = currentAnswerLines.join(" ").trim();
        faqEntries.push({ prompt: currentPrompt, response });
      }

      // Start a new prompt
      currentPrompt = line;
      currentAnswerLines = [];
    } else {
      // If the line does not end with "?", it belongs to the current prompt's answer
      if (currentPrompt !== null) {
        currentAnswerLines.push(line);
      }
      // If there's no currentPrompt yet, skip any introductory text
    }
  }

  // 5) After the loop, finalize the last prompt if present
  if (currentPrompt !== null) {
    const response = currentAnswerLines.join(" ").trim();
    faqEntries.push({ prompt: currentPrompt, response });
  }

  return faqEntries;
}
