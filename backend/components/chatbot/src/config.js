// src/config.js
const path = require('path');
require('dotenv').config();

function getEnv(name, opts = {}) {
  const val = process.env[name];
  if (!val && opts.required) {
    throw new Error(`Missing required env var ${name}`);
  }
  return val || opts.default;
}

const JSON_PATH = getEnv('JSON_PATH', { required: true });
const FUSE_THRESHOLD = parseFloat(getEnv('FUSE_THRESHOLD', { default: '0.6' }));
const SIM_THRESHOLD = parseFloat(getEnv('SIM_THRESHOLD', { default: '0.7' }));
const PORT = parseInt(getEnv('PORT', { default: '8000' }), 10);

module.exports = {
  JSON_PATH: path.resolve(process.cwd(), JSON_PATH),
  FUSE_THRESHOLD,
  SIM_THRESHOLD,
  PORT,
};
