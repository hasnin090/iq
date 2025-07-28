import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite config specifically for Netlify deployment
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  root: './client',
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    rollupOptions: {
      input: './client/index.html',
      external: [],
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    sourcemap: false,
    target: 'esnext'
  },
  },
  server: {
    port: 3000,
    host: true,
  },
  define: {
    'process.env': process.env,
  },
  envPrefix: 'VITE_',
  // Ensure environment variables are available to the client
  envDir: './',
});
