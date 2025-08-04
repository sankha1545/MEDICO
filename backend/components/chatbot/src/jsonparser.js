// File: src/jsonParser.js
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

/**
 * @typedef {{ question: string; answer: string }} QAEntry
 */

/** @private In-memory cache to avoid reloading the file repeatedly */
let _cache = null;

/** 
 * Resolve and validate the JSON_PATH environment variable.
 * @throws {Error} If JSON_PATH is not set.
 * @returns {string} Absolute path to the JSON file.
 */
function getJsonFilePath() {
  const rawPath = process.env.JSON_PATH;
  if (!rawPath) {
    throw new Error(
      'Environment variable JSON_PATH is required but was not provided.'
    );
  }
  return path.resolve(process.cwd(), rawPath);
}

/**
 * Synchronously parse the QA JSON file and return cleaned entries.
 * @throws {Error} For missing file, bad JSON, or invalid format.
 * @returns {QAEntry[]}
 */
export function parseJSONtoQASync() {
  // Note: This uses a blocking fs call; prefer the async variant below.
  const filePath = getJsonFilePath();
  let raw;
  try {
    raw = require('fs').readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(`Failed to read JSON file at ${filePath}: ${err.message}`);
  }

  let arr;
  try {
    arr = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON format in ${filePath}: ${err.message}`);
  }

  if (!Array.isArray(arr)) {
    throw new Error(`Expected top-level array in ${filePath}, but got ${typeof arr}`);
  }

  const cleaned = arr.reduce((acc, item, idx) => {
    const question = item.prompt || item.Q;
    const answer   = item.response || item.A;

    if (!question || !answer) {
      console.warn(
        `Skipping entry #${idx}: missing question or answer.`,
        item
      );
    } else {
      acc.push({
        question: String(question).trim().toLowerCase(),
        answer:   String(answer).trim(),
      });
    }
    return acc;
  }, []);

  console.log(`Loaded ${cleaned.length} valid Q&A entries (sync).`);
  return cleaned;
}

/**
 * Asynchronously parse the QA JSON file (with caching) and return cleaned entries.
 * @throws {Error} For missing file, bad JSON, or invalid format.
 * @returns {Promise<QAEntry[]>}
 */
export async function parseJSONtoQA() {
  if (_cache) {
    return _cache;
  }

  const filePath = getJsonFilePath();

  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    throw new Error(`Unable to read JSON file at ${filePath}: ${err.message}`);
  }

  let arr;
  try {
    arr = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err.message}`);
  }

  if (!Array.isArray(arr)) {
    throw new Error(
      `Expected an array in ${filePath}, but received ${typeof arr}`
    );
  }

  const cleaned = arr.reduce((acc, item, idx) => {
    const question = item.prompt || item.Q;
    const answer   = item.response || item.A;

    if (!question || !answer) {
      console.warn(
        `Skipping entry #${idx}: both 'prompt/Q' and 'response/A' required.`,
        item
      );
    } else {
      acc.push({
        question: String(question).trim().toLowerCase(),
        answer:   String(answer).trim(),
      });
    }
    return acc;
  }, []);

  console.log(`✅ Loaded ${cleaned.length} valid Q&A entries from JSON.`);
  // Cache result for subsequent calls
  _cache = cleaned;
  return cleaned;
}
