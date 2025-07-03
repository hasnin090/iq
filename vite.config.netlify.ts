import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: './client',
  base: './',
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'wouter'],
          query: ['@tanstack/react-query'],
          ui: ['lucide-react', 'framer-motion']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared')
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'import.meta.env.VITE_API_URL': '"/api"'
  },
  esbuild: {
    drop: ['console', 'debugger'],
  }
})