// src/jsonParser.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Reads qa.json, validates entries, and returns:
 *   [{ question, answer }, ...]
 */
function parseJSONtoQA() {
  const rawPath = process.env.JSON_PATH;
  if (!rawPath) throw new Error('JSON_PATH not set in .env');

  const fullPath = path.resolve(process.cwd(), rawPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`JSON file not found at ${fullPath}`);
  }

  const raw = fs.readFileSync(fullPath, 'utf8');

  let arr;
  try {
    arr = JSON.parse(raw);
  } catch (err) {
    console.error('❌ Failed to parse JSON:', err);
    throw err;
  }

  if (!Array.isArray(arr)) {
    throw new Error('❌ Top-level JSON is not an array');
  }

  const cleaned = arr
    .map((item, index) => {
      if (!item.prompt || !item.response) {
        console.warn(`⚠️ Skipping invalid entry at index ${index}`, item);
        return null;
      }

      return {
        question: String(item.prompt).trim().toLowerCase(),
        answer: String(item.response).trim(),
      };
    })
    .filter(Boolean); // remove nulls

  console.log(`✅ Loaded ${cleaned.length} valid Q&A entries from JSON`);
  return cleaned;
}

module.exports = { parseJSONtoQA };
