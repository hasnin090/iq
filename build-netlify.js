#!/usr/bin/env node

import { build } from 'vite'
import { build as esbuild } from 'esbuild'
import fs from 'fs'
import path from 'path'

async function buildForNetlify() {
  console.log('🚀 بناء التطبيق للنشر على Netlify...')
  
  try {
    // 1. بناء الواجهة الأمامية
    console.log('📦 بناء الواجهة الأمامية...')
    await build({
      build: {
        outDir: 'dist/public',
        emptyOutDir: true
      }
    })
    
    // 2. بناء الخادم
    console.log('⚙️ بناء الخادم...')
    await esbuild({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'esm',
      outdir: 'dist',
      external: [
        // قواعد البيانات
        '@neondatabase/serverless',
        'pg',
        'postgres',
        
        // Firebase
        'firebase',
        'firebase-admin',
        
        // مكتبات Node.js الأساسية
        'express',
        'express-session',
        'multer',
        'bcryptjs',
        'archiver',
        'exceljs',
        'uuid',
        'ws',
        
        // مكتبات أخرى
        'drizzle-orm',
        'drizzle-zod',
        'zod',
        'connect-pg-simple',
        'memorystore',
        'passport',
        'passport-local'
      ],
      banner: {
        js: `
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`
      }
    })
    
    // 3. إنشاء netlify.toml
    console.log('📝 إنشاء ملف التكوين...')
    const netlifyConfig = `[build]
  command = "node build-netlify.js"
  publish = "dist/public"
  functions = "dist/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/server/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@neondatabase/serverless", "pg", "postgres", "firebase", "firebase-admin"]

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
`
    
    fs.writeFileSync('netlify.toml', netlifyConfig)
    
    // 4. إنشاء دالة Netlify للخادم
    console.log('🔧 إنشاء دالة Netlify...')
    const functionsDir = 'dist/functions'
    if (!fs.existsSync(functionsDir)) {
      fs.mkdirSync(functionsDir, { recursive: true })
    }
    
    const netlifyHandler = `import { app } from '../index.js';
import serverless from 'serverless-http';

const handler = serverless(app);

export { handler };
`
    
    fs.writeFileSync(path.join(functionsDir, 'server.js'), netlifyHandler)
    
    // 5. إنشاء package.json للإنتاج
    console.log('📋 إنشاء package.json للإنتاج...')
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
        "express-session": "^1.18.1",
        "bcryptjs": "^3.0.2",
        "drizzle-orm": "^0.39.3",
        "drizzle-zod": "^0.7.0",
        "zod": "^3.23.8",
        "multer": "^1.4.5-lts.2",
        "uuid": "^11.1.0",
        "archiver": "^7.0.1",
        "exceljs": "^4.4.0",
        "firebase": "^11.9.1",
        "firebase-admin": "^13.4.0",
        "connect-pg-simple": "^10.0.0",
        "passport": "^0.7.0",
        "passport-local": "^1.0.0",
        "ws": "^8.18.0",
        "serverless-http": "^3.2.0"
      }
    }
    
    fs.writeFileSync('dist/package.json', JSON.stringify(productionPackage, null, 2))
    
    // 6. نسخ الملفات المطلوبة
    console.log('📁 نسخ الملفات المطلوبة...')
    
    // نسخ shared
    const sharedSrc = 'shared'
    const sharedDest = 'dist/shared'
    if (fs.existsSync(sharedSrc)) {
      fs.cpSync(sharedSrc, sharedDest, { recursive: true })
    }
    
    // إنشاء ملف البيئة المثال
    const envExample = `# قاعدة البيانات
DATABASE_URL=postgresql://username:password@host:5432/database

# اختياري: متغيرات Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# اختياري: متغيرات Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# سر الجلسة
SESSION_SECRET=your_random_session_secret_here
`
    
    fs.writeFileSync('dist/.env.example', envExample)
    
    // 7. إنشاء ملف README للنشر
    const deployReadme = `# نظام المحاسبة العربي - النشر على Netlify

## خطوات النشر:

### 1. رفع الملفات
- ارفع مجلد \`dist\` كاملاً إلى مستودع GitHub
- أو ارفع الملفات مباشرة إلى Netlify

### 2. تكوين المتغيرات البيئية في Netlify
انتقل إلى Site Settings > Environment Variables وأضف:

\`\`\`
DATABASE_URL=postgresql://your_neon_database_url
SESSION_SECRET=your_random_secret_key
\`\`\`

### 3. اختياري - Firebase (للتخزين السحابي)
\`\`\`
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
\`\`\`

### 4. اختياري - Supabase (للنسخ الاحتياطي)
\`\`\`
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
\`\`\`

## معلومات النظام:
- المستخدم الافتراضي: admin
- كلمة المرور الافتراضية: admin123
- البورت الافتراضي: 5000 (تلقائي في Netlify)

## ميزات النظام:
- إدارة المعاملات المالية
- إدارة المشاريع والمستخدمين
- دفتر الأستاذ والمستحقات
- تصدير التقارير
- النسخ الاحتياطي التلقائي
- التخزين السحابي
`
    
    fs.writeFileSync('dist/README.md', deployReadme)
    
    console.log('✅ تم بناء التطبيق بنجاح للنشر على Netlify!')
    console.log('📁 الملفات جاهزة في مجلد dist/')
    console.log('🌐 يمكنك الآن رفع المجلد إلى Netlify أو GitHub')
    
  } catch (error) {
    console.error('❌ خطأ في بناء التطبيق:', error)
    process.exit(1)
  }
}

buildForNetlify()