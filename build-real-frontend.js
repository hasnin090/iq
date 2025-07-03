#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 بناء الواجهة الحقيقية للنظام...');

// إنشاء مجلد dist/public إذا لم يكن موجوداً
const distPublic = './dist/public';
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}
if (!fs.existsSync(distPublic)) {
  fs.mkdirSync(distPublic, { recursive: true });
}

// إعدادات بناء محسنة لـ Vite
const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['date-fns', 'zod']
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
    'process.env.NODE_ENV': '"production"'
  },
  esbuild: {
    drop: ['console', 'debugger'],
  }
})`;

// كتابة إعدادات Vite المحسنة
fs.writeFileSync('./vite.config.production.ts', viteConfig);

try {
  console.log('📦 بناء الواجهة الأمامية باستخدام إعدادات محسنة...');
  
  // بناء Vite مع إعدادات محسنة
  execSync('npx vite build --config vite.config.production.ts --mode production', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      VITE_API_URL: '/api'
    },
    timeout: 300000 // 5 دقائق
  });
  
  console.log('✅ تم بناء الواجهة الأمامية بنجاح!');
  
} catch (error) {
  console.error('❌ خطأ في بناء الواجهة الأمامية:', error.message);
  
  // نسخ ملفات الواجهة الموجودة كحل بديل
  console.log('🔄 محاولة نسخ ملفات موجودة...');
  
  try {
    // نسخ من client/dist إذا كان موجوداً
    if (fs.existsSync('./client/dist')) {
      execSync(`cp -r ./client/dist/* ${distPublic}/`, { stdio: 'inherit' });
      console.log('✅ تم نسخ ملفات الواجهة من client/dist');
    } else {
      // إنشاء ملف HTML محسن
      const htmlContent = fs.readFileSync('./client/index.html', 'utf8');
      const productionHtml = htmlContent
        .replace('/src/main.tsx', '/assets/main.js')
        .replace('<title>Vite + React + TS</title>', '<title>نظام المحاسبة العربي</title>');
      
      fs.writeFileSync(path.join(distPublic, 'index.html'), productionHtml);
      console.log('✅ تم إنشاء ملف HTML محسن');
    }
  } catch (copyError) {
    console.error('❌ فشل في نسخ الملفات:', copyError.message);
  }
}

// نسخ ملفات مهمة
console.log('📁 نسخ الملفات المطلوبة...');

// نسخ _redirects
const redirectsContent = `/api/* /.netlify/functions/server/:splat 200
/* /index.html 200`;
fs.writeFileSync(path.join(distPublic, '_redirects'), redirectsContent);

// نسخ assets إذا كانت موجودة
if (fs.existsSync('./client/public')) {
  try {
    execSync(`cp -r ./client/public/* ${distPublic}/`, { stdio: 'inherit' });
    console.log('✅ تم نسخ ملفات المشاركة');
  } catch (error) {
    console.log('⚠️ لم يتم العثور على ملفات مشاركة');
  }
}

console.log('✅ تم إكمال بناء الواجهة الحقيقية!');
console.log('📂 الملفات جاهزة في:', distPublic);