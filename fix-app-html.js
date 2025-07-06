import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 إصلاح مشكلة app.html...');

try {
  // 1. بناء التطبيق باستخدام Vite
  console.log('🏗️ بناء التطبيق باستخدام Vite...');
  execSync('npx vite build', { stdio: 'inherit', cwd: __dirname });
  
  const publicDestDir = path.join(__dirname, 'dist', 'public');
  const viteIndexPath = path.join(publicDestDir, 'index.html');
  const appPath = path.join(publicDestDir, 'app.html');
  
  // 2. نسخ index.html المبني من Vite إلى app.html
  if (fs.existsSync(viteIndexPath)) {
    const viteIndexContent = fs.readFileSync(viteIndexPath, 'utf8');
    fs.writeFileSync(appPath, viteIndexContent);
    console.log('📄 تم نسخ index.html المبني من Vite إلى app.html');
    
    // التحقق من وجود السكريبتات
    if (viteIndexContent.includes('script type="module"')) {
      console.log('✅ app.html يحتوي على السكريپتات المطلوبة');
    } else {
      console.log('❌ خطأ: app.html لا يحتوي على السكريپتات!');
    }
  }
  
  // 3. استبدال index.html بصفحة الترحيب
  const improvedWelcomePath = path.join(__dirname, 'improved-welcome-page.html');
  if (fs.existsSync(improvedWelcomePath)) {
    const welcomeContent = fs.readFileSync(improvedWelcomePath, 'utf8');
    fs.writeFileSync(viteIndexPath, welcomeContent);
    console.log('📄 تم استبدال index.html بصفحة الترحيب');
  }
  
  // 4. إنشاء ملف _redirects
  const redirectsContent = `# API routes
/api/*  /.netlify/functions/api/:splat  200

# Application routes - توجيه إلى app.html
/app  /app.html  200
/dashboard/*  /app.html  200
/transactions/*  /app.html  200
/customers/*  /app.html  200
/reports/*  /app.html  200
/settings/*  /app.html  200

# Welcome page fallback
/*  /index.html  200`;

  fs.writeFileSync(path.join(publicDestDir, '_redirects'), redirectsContent);
  console.log('🔄 تم إنشاء ملف _redirects');
  
  console.log('✅ تم إصلاح app.html بنجاح!');
  
} catch (error) {
  console.error('❌ فشل الإصلاح:', error);
  process.exit(1);
}
