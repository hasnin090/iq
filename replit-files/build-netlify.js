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

  // 4. إنشاء serverless function للـ API
  const functionCode = `
const express = require('express');
const serverless = require('serverless-http');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'النظام يعمل بشكل طبيعي'
  });
});

// Main API routes - placeholder for deployment
app.all('/api/*', (req, res) => {
  res.status(503).json({ 
    message: 'النظام جاهز للنشر - يرجى إعداد متغيرات البيئة',
    status: 'ready_for_deployment',
    endpoint: req.path,
    method: req.method
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'المسار غير موجود' });
});

app.use((err, req, res, next) => {
  console.error('خطأ في الخادم:', err);
  res.status(500).json({ message: 'خطأ داخلي في الخادم' });
});

module.exports.handler = serverless(app);
`;

  writeFileSync('.netlify/functions/api.js', functionCode);
  console.log('✅ تم إنشاء serverless function');

  // إنشاء package.json للـ functions
  const functionsPackageJson = {
    "name": "netlify-functions",
    "version": "1.0.0",
    "dependencies": {
      "express": "^4.21.2",
      "serverless-http": "^3.2.0"
    }
  };
  
  writeFileSync('.netlify/functions/package.json', JSON.stringify(functionsPackageJson, null, 2));
  console.log('✅ تم إنشاء package.json للـ functions');

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