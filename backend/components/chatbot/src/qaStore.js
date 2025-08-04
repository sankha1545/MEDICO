// src/qaStore.js
const Fuse = require('fuse.js');
const stringSimilarity = require('string-similarity');
const { parseJSONtoQA } = require('./jsonparser');
require('dotenv').config();

const fuseThreshold = parseFloat(process.env.FUSE_THRESHOLD  || '0.6');
const simThreshold  = parseFloat(process.env.SIM_THRESHOLD   || '0.7');

let qaList = [];
let fuse   = null;

/**
 * Initialize the in-memory Q&A store.
 * Builds a Fuse.js index over all questions.
 */
function initQAStore() {
  qaList = parseJSONtoQA();

  if (qaList.length === 0) {
    console.warn('⚠️ QA list is empty—check your JSON source');
  }

  fuse = new Fuse(qaList, {
    keys: ['question'],
    includeScore: true,
    threshold: 0.6,
    ignoreLocation: true,
    minMatchCharLength: 3,
  });

  console.log('✅ Fuse.js index initialized');
}

/**
 * Given any userQuestion string, returns the stored answer
 * if a match is found by Fuse (≤ fuseThreshold) or by
 * string-similarity (≥ simThreshold). Otherwise null.
 */
export function findBestAnswer(userQuestion) {
  if (!fuse) {
    throw new Error('QA store not initialized; call initQAStore() first');
  }
  const q = String(userQuestion).trim().toLowerCase();
  if (q.length < 3) return null;

  // 1) Fuse.js fuzzy search
  const [fmatch] = fuse.search(q, { limit: 1 });
  if (fmatch && typeof fmatch.score === 'number') {
    console.log(`🔍 Fuse matched "${fmatch.item.question}" (score: ${fmatch.score})`);
    if (fmatch.score <= fuseThreshold) {
      return fmatch.item.answer;
    }
  }

  // 2) Fallback: string-similarity ratio
  const questions = qaList.map((e) => e.question);
  const { bestMatch } = stringSimilarity.findBestMatch(q, questions);
  console.log(`🔍 Sim similarity: best = "${bestMatch.target}" (rating: ${bestMatch.rating})`);
  if (bestMatch.rating >= simThreshold) {
    // find its answer
    const entry = qaList.find((e) => e.question === bestMatch.target);
    return entry?.answer ?? null;
  }

  // 3) No good match
  return null;
}

module.exports = { initQAStore, findBestAnswer };
