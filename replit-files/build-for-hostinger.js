#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 بدء عملية تحضير البرنامج للنشر على Hostinger...\n');

try {
  // 1. تنظيف المجلدات القديمة
  console.log('1️⃣ تنظيف الملفات القديمة...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // 2. بناء الواجهة الأمامية
  console.log('2️⃣ بناء الواجهة الأمامية...');
  execSync('vite build', { stdio: 'inherit' });

  // 3. بناء الخادم
  console.log('3️⃣ بناء الخادم...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

  // 4. نسخ الملفات المطلوبة
  console.log('4️⃣ نسخ الملفات المطلوبة...');
  
  // نسخ ملفات الواجهة الأمامية المبنية
  if (fs.existsSync('client/dist')) {
    if (!fs.existsSync('dist/public')) {
      fs.mkdirSync('dist/public', { recursive: true });
    }
    execSync('cp -r client/dist/* dist/public/', { stdio: 'inherit' });
  }

  // إنشاء package.json للإنتاج
  console.log('5️⃣ إنشاء package.json للإنتاج...');
  const originalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const productionPackage = {
    name: originalPackage.name,
    version: originalPackage.version,
    type: originalPackage.type,
    license: originalPackage.license,
    scripts: {
      start: "NODE_ENV=production node index.js"
    },
    dependencies: originalPackage.dependencies
  };

  fs.writeFileSync('dist/package.json', JSON.stringify(productionPackage, null, 2));

  // 6. إنشاء ملف البدء
  console.log('6️⃣ إنشاء ملف البدء...');
  const startupScript = `// Startup script for Hostinger
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
import('./index.js');
`;
  fs.writeFileSync('dist/start.js', startupScript);

  // 7. نسخ الملفات الإضافية
  console.log('7️⃣ نسخ الملفات الإضافية...');
  
  // نسخ مجلد shared
  if (fs.existsSync('shared')) {
    execSync('cp -r shared dist/', { stdio: 'inherit' });
  }

  // إنشاء مجلدات مطلوبة
  ['uploads', 'backups'].forEach(dir => {
    const distDir = path.join('dist', dir);
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
  });

  // 8. إنشاء ملف README للنشر
  console.log('8️⃣ إنشاء تعليمات النشر...');
  const deployReadme = `# نشر البرنامج على Hostinger

## خطوات سريعة:

1. ارفع محتويات مجلد 'dist' إلى خادم Hostinger
2. أنشئ ملف .env مع متغيرات البيئة المطلوبة
3. في cPanel > Node.js Apps:
   - اختر Node.js v18+
   - Startup file: start.js أو index.js
   - اضغط "Create"

## متغيرات البيئة المطلوبة:
- DATABASE_URL
- SESSION_SECRET
- NODE_ENV=production
- PORT (عادة 3000)

راجع deployment-guide.md للتفاصيل الكاملة.
`;
  fs.writeFileSync('dist/README-DEPLOY.md', deployReadme);

  console.log('\n✅ تم تحضير البرنامج بنجاح للنشر!');
  console.log('📁 جميع الملفات جاهزة في مجلد: dist/');
  console.log('📖 راجع الملف deployment-guide.md للتعليمات التفصيلية');
  
} catch (error) {
  console.error('\n❌ حدث خطأ أثناء التحضير:', error.message);
  process.exit(1);
}