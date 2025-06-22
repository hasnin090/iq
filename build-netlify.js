#!/usr/bin/env node

import { execSync } from 'child_process';
import { mkdirSync, copyFileSync, existsSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 بدء عملية البناء لـ Netlify...');

try {
  // 1. بناء الواجهة الأمامية
  console.log('📦 بناء الواجهة الأمامية...');
  execSync('vite build', { stdio: 'inherit' });

  // 2. بناء الخادم
  console.log('⚙️ بناء الخادم...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18', { stdio: 'inherit' });

  // 3. إنشاء مجلد functions
  console.log('📁 إنشاء مجلد functions...');
  mkdirSync('.netlify/functions', { recursive: true });

  // 4. نسخ ملف الخادم إلى functions
  if (existsSync('dist/index.js')) {
    copyFileSync('dist/index.js', '.netlify/functions/index.js');
    console.log('✅ تم نسخ ملف الخادم');
  }

  // 5. نسخ مجلدات الملفات
  const copyDirectory = (src, dest) => {
    if (!existsSync(src)) {
      console.log(`⚠️ المجلد ${src} غير موجود، تم التخطي`);
      return;
    }
    
    mkdirSync(dest, { recursive: true });
    const entries = readdirSync(src);
    
    for (const entry of entries) {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);
      
      if (statSync(srcPath).isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
      }
    }
  };

  // نسخ مجلد uploads
  console.log('📎 نسخ مجلد الملفات...');
  copyDirectory('uploads', 'dist/uploads');
  
  // نسخ مجلد backups
  console.log('💾 نسخ مجلد النسخ الاحتياطية...');
  copyDirectory('backups', 'dist/backups');

  // 6. إنشاء ملف _redirects للواجهة الأمامية
  console.log('🔄 إنشاء ملف redirects...');
  const redirectsContent = `
/api/* /.netlify/functions/index/:splat 200
/* /index.html 200
`;
  
  writeFileSync('dist/_redirects', redirectsContent.trim());

  console.log('✨ تم إكمال عملية البناء بنجاح!');
  console.log('📋 الملفات جاهزة في مجلد dist/');
  
} catch (error) {
  console.error('❌ فشل في عملية البناء:', error.message);
  process.exit(1);
}