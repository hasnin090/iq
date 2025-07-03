#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 بدء بناء النشر لـ Netlify...');

try {
  // Step 1: Build frontend with Vite
  console.log('📦 بناء الواجهة الأمامية...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Step 2: Copy _redirects to dist
  console.log('📁 نسخ ملف _redirects...');
  if (fs.existsSync('_redirects')) {
    fs.copyFileSync('_redirects', 'dist/_redirects');
  }

  // Step 3: Ensure netlify/functions directory exists
  console.log('📂 تجهيز مجلد الـ functions...');
  const functionsDir = 'netlify/functions';
  if (!fs.existsSync(functionsDir)) {
    fs.mkdirSync(functionsDir, { recursive: true });
  }

  // Step 4: Copy essential server files to functions
  console.log('📋 نسخ ملفات الخادم...');
  const serverFiles = [
    'server/storage.js',
    'server/auth-routes.js', 
    'server/middleware.js',
    'shared'
  ];

  serverFiles.forEach(file => {
    const srcPath = path.join(process.cwd(), file);
    const destPath = path.join(functionsDir, path.basename(file));
    
    if (fs.existsSync(srcPath)) {
      if (fs.statSync(srcPath).isDirectory()) {
        // Copy directory recursively
        copyDirectory(srcPath, destPath);
      } else {
        // Copy single file
        fs.copyFileSync(srcPath, destPath);
      }
      console.log(`  ✅ تم نسخ ${file}`);
    } else {
      console.log(`  ⚠️  ${file} غير موجود`);
    }
  });

  // Step 5: Create environment variables template
  console.log('📝 إنشاء قالب متغيرات البيئة...');
  const envTemplate = `# متغيرات البيئة المطلوبة لـ Netlify
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-super-secret-session-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
NODE_ENV=production
FRONTEND_URL=https://your-site.netlify.app
`;

  fs.writeFileSync('netlify-env-template.txt', envTemplate);

  console.log('✅ تم بناء النشر بنجاح!');
  console.log('\n📋 الملفات الجاهزة للرفع:');
  console.log('  📁 dist/ - الواجهة الأمامية');
  console.log('  📁 netlify/ - functions الخادم');
  console.log('  📄 netlify.toml - إعدادات النشر');
  console.log('  📄 _redirects - قواعد التوجيه');

} catch (error) {
  console.error('❌ خطأ في البناء:', error.message);
  process.exit(1);
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}