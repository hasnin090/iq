import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 بدء عملية البناء البديلة لـ Netlify...');

try {
  // 1. بناء التطبيق أولاً باستخدام Vite
  console.log('🏗️ بناء التطبيق باستخدام Vite...');
  const { execSync } = await import('child_process');
  
  try {
    // محاولة بناء التطبيق باستخدام Vite
    execSync('npm ci && npx vite build', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ تم بناء التطبيق بنجاح باستخدام Vite');
    
    // بعد البناء الناجح، نسخ التطبيق المبني إلى app.html
    const publicDestDir = path.join(__dirname, 'dist', 'public');
    const appIndexPath = path.join(publicDestDir, 'index.html');
    const appPath = path.join(publicDestDir, 'app.html');
    
    if (fs.existsSync(appIndexPath)) {
      // نسخ التطبيق الفعلي الذي يحتوي على جميع السكريبتات إلى app.html
      fs.copyFileSync(appIndexPath, appPath);
      console.log('📄 تم نسخ التطبيق الرئيسي (مع السكريبتات) إلى app.html');
      
      // التأكد من وجود ملف app.html وأنه يحتوي على السكريبتات
      const appContent = fs.readFileSync(appPath, 'utf8');
      if (appContent.includes('script type="module"')) {
        console.log('✅ app.html يحتوي على السكريبتات المطلوبة');
      } else {
        console.log('⚠️ تحذير: app.html لا يحتوي على السكريبتات!');
      }
    }
    
    // الآن استبدال index.html بصفحة الترحيب المحسنة
    const improvedWelcomePath = path.join(__dirname, 'improved-welcome-page.html');
    
    if (fs.existsSync(improvedWelcomePath)) {
      const welcomeContent = fs.readFileSync(improvedWelcomePath, 'utf8');
      fs.writeFileSync(appIndexPath, welcomeContent);
      console.log('📄 تم استبدال index.html بصفحة الترحيب المحسنة');
    }
    
  } catch (viteError) {
    console.log('⚠️ فشل في استخدام Vite، جاري استخدام البناء البديل...');
    
    // إنشاء المجلدات اللازمة
    const functionsDir = path.join(__dirname, 'netlify', 'functions');
    const publicDestDir = path.join(__dirname, 'dist', 'public');
    
    if (!fs.existsSync(functionsDir)) {
      fs.mkdirSync(functionsDir, { recursive: true });
      console.log('📁 تم إنشاء مجلد netlify/functions');
    }

    if (!fs.existsSync(publicDestDir)) {
      fs.mkdirSync(publicDestDir, { recursive: true });
      console.log('📁 تم إنشاء مجلد dist/public');
    }

    // نسخ الملفات الثابتة من مجلد public
    const publicSrcDir = path.join(__dirname, 'public');
    
    if (fs.existsSync(publicSrcDir)) {
      console.log('📄 جاري نسخ الملفات الثابتة...');
      const copyDir = (src, dest) => {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        
        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
            console.log(`  ✓ تم نسخ مجلد ${entry.name}/`);
          } else {
            fs.copyFileSync(srcPath, destPath);
            console.log(`  ✓ تم نسخ ${entry.name}`);
          }
        }
      };
      
      copyDir(publicSrcDir, publicDestDir);
    }

    // نسخ التطبيق الأصلي (client/index.html) إذا لم يتم بناء التطبيق
    const clientIndexPath = path.join(__dirname, 'client', 'index.html');
    const destIndexPath = path.join(publicDestDir, 'app.html');
    
    if (fs.existsSync(clientIndexPath)) {
      fs.copyFileSync(clientIndexPath, destIndexPath);
      console.log('📄 تم نسخ ملف التطبيق الأصلي إلى app.html');
    }
  }

  // 2. إنشاء ملف _redirects للتوجيه
  const publicDestDir = path.join(__dirname, 'dist', 'public');
  
  const redirectsContent = `# API routes to Netlify Functions
/api/*  /.netlify/functions/api/:splat  200

# Application routes
/app  /app.html  200
/dashboard/*  /app.html  200

# SPA fallback for React Router (for app routes)
/transactions/*  /app.html  200
/customers/*  /app.html  200
/reports/*  /app.html  200
/settings/*  /app.html  200

# Welcome page fallback
/*  /index.html  200`;

  fs.writeFileSync(path.join(publicDestDir, '_redirects'), redirectsContent);
  console.log('🔄 تم إنشاء ملف _redirects للتوجيه');

  // 3. إنشاء معلومات البناء
  const buildInfo = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'production'
  };

  fs.writeFileSync(
    path.join(publicDestDir, 'build-info.json'), 
    JSON.stringify(buildInfo, null, 2)
  );

  console.log('✅ تم اكتمال عملية البناء البديلة بنجاح!');
  console.log('📁 مجلد المخرجات: dist/public');
  console.log('⚡ مجلد الدوال: netlify/functions');
  console.log('🌐 جاهز للنشر!');

} catch (error) {
  console.error('❌ فشل البناء:', error);
  process.exit(1);
}
