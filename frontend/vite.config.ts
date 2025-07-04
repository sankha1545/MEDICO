import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    // No need to set COOP here; we do it in configureServer below
  },
  optimizeDeps: {
    include: ['animejs'], // ✅ Important fix for animejs default import
  },
  // Add this hook to set the header on all responses
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Set COOP to allow popups to close themselves
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
      // If you had set Cross-Origin-Embedder-Policy elsewhere, ensure it's not too strict:
      // res.removeHeader('Cross-Origin-Embedder-Policy');
      next();
    });
  },
});
