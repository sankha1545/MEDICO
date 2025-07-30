// File: vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { ProxyOptions } from 'vite';

export default defineConfig(({ mode }) => {
  // Backend URL can be overridden via environment variables
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

  // Shared proxy settings for all /api routes
  const apiProxy: ProxyOptions = {
    target: backendUrl,
    changeOrigin: true,
    secure: false,
    ws: true,
    rewrite: (path) => path.replace(/^\/api/, '/api'),
  };

  return {
    plugins: [
      react({
        // Use React fast refresh in development
        fastRefresh: mode === 'development',
      }),
    ],

    server: {
      // Proxy all /api calls (including /api/medical) to the Express backend
      proxy: {
        '/api': apiProxy,
      },

      // Add Cross-Origin policies for enhanced security
      host: true,
      port: 5173,
      strictPort: true,
      cors: {
        origin: true,
        credentials: true,
      },

      // Inject Cross‑Origin‑Opener‑Policy header on every response
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          next();
        });
      },
    },

    build: {
      // Ensure compatibility across environments
      target: 'esnext',
      outDir: 'dist',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          // Separate vendor chunk for faster caching
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },

    optimizeDeps: {
      // Make sure animejs default import works correctly
      include: ['animejs'],
      // Exclude large libraries that should be lazy-loaded
      exclude: ['some-legacy-lib'],
    },

    define: {
      // Expose backend URL in client code
      __BACKEND_URL__: JSON.stringify(backendUrl),
    },
  };
});
