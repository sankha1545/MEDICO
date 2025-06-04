// File: src/utils/logger.ts

export function info(message: string) {
  console.log(`ℹ️ [INFO] ${new Date().toISOString()} – ${message}`);
}

export function error(message: string) {
  console.error(`❌ [ERROR] ${new Date().toISOString()} – ${message}`);
}
