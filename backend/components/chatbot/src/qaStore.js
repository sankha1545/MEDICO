const Fuse = require('fuse.js');
const { parseJSONtoQA } = require('./jsonParser');
require('dotenv').config();

const fuseThreshold = parseFloat(process.env.FUSE_THRESHOLD || '0.6');
let fuse = null;

function initQAStore() {
  const qaList = parseJSONtoQA();

  if (!Array.isArray(qaList) || qaList.length === 0) {
    console.warn('⚠️  QA list is empty. Check your JSON source.');
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

function findBestAnswer(rawQuestion) {
  if (!fuse) {
    throw new Error('QA store not initialized. Call initQAStore() first.');
  }

  const question = String(rawQuestion).trim().toLowerCase();
  const results = fuse.search(question, { limit: 1 });

  if (!results.length) return null;

  const { item, score } = results[0];
  if (score <= fuseThreshold) {
    return item.answer;
  } else {
    console.log(`❌ No close enough match (score: ${score})`);
    return null;
  }
}

module.exports = { initQAStore, findBestAnswer };
