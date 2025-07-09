import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all /api calls (including /api/medical) to your Express backend on port 5000
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
    // We inject Cross‑Origin‑Opener‑Policy via configureServer below
  },
  optimizeDeps: {
    // Ensure animejs default import works correctly
    include: ['animejs'],
  },
  configureServer(server) {
    // Add a middleware to set COOP on every response
    server.middlewares.use((req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
      next();
    });
  },
});
