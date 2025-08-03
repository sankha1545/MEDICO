import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { ProxyOptions } from 'vite';

export default defineConfig(({ mode }) => {
   const backendUrl = process.env.BACKEND_URL || 'http://13.234.123.45:4000';

  // Proxy config (only used during development)
  const apiProxy: ProxyOptions = {
    target: backendUrl,
    changeOrigin: true,
    secure: false,
    ws: true,
    rewrite: (path) => path.replace(/^\/api/, '/api'),
  };

  return {
    plugins: [react({ fastRefresh: mode === 'development' })],
    server: {
      proxy: mode === 'development' ? { '/api': apiProxy } : undefined,
      host: true,
      port: 5173,
      strictPort: true,
      cors: {
        origin: true,
        credentials: true,
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          next();
        });
      },
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
    optimizeDeps: {
      include: ['animejs'],
      exclude: ['some-legacy-lib'],
    },
    define: {
      __BACKEND_URL__: JSON.stringify(backendUrl),
    },
  };
});
