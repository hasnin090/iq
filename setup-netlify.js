#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

console.log('🔧 إعداد ملفات Netlify...')

// إنشاء دالة Netlify للخادم
const netlifyHandler = `import express from 'express';
import serverless from 'serverless-http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// استيراد التطبيق الرئيسي
const app = express();

// إعداد المسارات الأساسية
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// تصدير الدالة
const handler = serverless(app);
export { handler };
`

fs.writeFileSync('dist/functions/server.js', netlifyHandler)

// إنشاء package.json للإنتاج
const productionPackage = {
  "name": "arabic-accounting-system",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.10.4",
    "express": "^4.21.2",
    "serverless-http": "^3.2.0"
  }
}

fs.writeFileSync('dist/package.json', JSON.stringify(productionPackage, null, 2))

// نسخ shared إذا كان موجود
if (fs.existsSync('shared')) {
  fs.cpSync('shared', 'dist/shared', { recursive: true })
}

// إنشاء README للنشر
const deployReadme = `# نظام المحاسبة العربي - Netlify

## تعليمات النشر:

### 1. رفع إلى GitHub
\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
\`\`\`

### 2. ربط مع Netlify
- اذهب إلى netlify.com
- اختر "New site from Git"
- اختر المستودع
- Build command: \`npm run build:netlify\`
- Publish directory: \`dist/public\`

### 3. إضافة متغيرات البيئة
في Netlify Dashboard > Site Settings > Environment Variables:

\`\`\`
DATABASE_URL=postgresql://your_neon_database_url
SESSION_SECRET=your_random_secret_here
\`\`\`

### 4. معلومات تسجيل الدخول
- المستخدم: admin
- كلمة المرور: admin123

## الميزات:
- نظام محاسبة شامل باللغة العربية
- إدارة المعاملات والمشاريع
- دفتر الأستاذ والمستحقات
- تصدير التقارير والنسخ الاحتياطي
`

fs.writeFileSync('dist/README.md', deployReadme)

// إنشاء _redirects للـ SPA routing
const redirects = `# Netlify redirects
/api/* /.netlify/functions/server/:splat 200
/* /index.html 200
`

fs.writeFileSync('dist/public/_redirects', redirects)

console.log('✅ تم إعداد ملفات Netlify بنجاح!')