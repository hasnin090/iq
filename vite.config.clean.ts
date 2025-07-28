import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// تكوين Vite مبسط وواضح
export default defineConfig({
  plugins: [react()],
  
  // مجلد الجذر للمشروع
  root: './client',
  
  // إعدادات البناء
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    sourcemap: false,
    
    // تحسين الأداء
    rollupOptions: {
      input: './client/index.html',
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    },
    
    // إعدادات التحسين
    minify: 'terser',
    target: 'esnext',
    chunkSizeWarningLimit: 1000
  },
  
  // المسارات المختصرة
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@components': path.resolve(__dirname, './client/src/components'),
      '@pages': path.resolve(__dirname, './client/src/pages'),
      '@utils': path.resolve(__dirname, './client/src/utils'),
      '@hooks': path.resolve(__dirname, './client/src/hooks'),
      '@lib': path.resolve(__dirname, './client/src/lib')
    }
  },
  
  // إعدادات الخادم للتطوير
  server: {
    port: 3000,
    host: true,
    open: true
  },
  
  // معالجة متغيرات البيئة
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
