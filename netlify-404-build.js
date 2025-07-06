import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 بدء عملية البناء البديلة لـ Netlify...');

try {
  // 1. إنشاء المجلدات اللازمة
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

  // 2. نسخ الملفات الثابتة من مجلد public
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

  // 3. إنشاء ملف _redirects للتوجيه
  const redirectsContent = `# API routes to Netlify Functions
/api/*  /.netlify/functions/api/:splat  200

# SPA fallback for React Router
/*  /index.html  200`;

  fs.writeFileSync(path.join(publicDestDir, '_redirects'), redirectsContent);
  console.log('🔄 تم إنشاء ملف _redirects للتوجيه');

  // 4. إنشاء ملف index.html من صفحة الترحيب المحسنة
  const indexPath = path.join(publicDestDir, 'index.html');
  const improvedWelcomePath = path.join(__dirname, 'improved-welcome-page.html');
  
  if (fs.existsSync(improvedWelcomePath)) {
    // نسخ محتوى صفحة الترحيب المحسنة
    const welcomeContent = fs.readFileSync(improvedWelcomePath, 'utf8');
    fs.writeFileSync(indexPath, welcomeContent);
    console.log('📄 تم نسخ صفحة الترحيب المحسنة إلى index.html');
  } else {
    // إنشاء صفحة بسيطة إذا لم تكن صفحة الترحيب المحسنة موجودة
    const indexContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>نظام المحاسبة</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
      direction: rtl;
    }
    .container {
      text-align: center;
      padding: 2rem;
      border-radius: 8px;
      background-color: white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>مرحباً بك في نظام المحاسبة</h1>
    <p>تم بناء الموقع بنجاح!</p>
    <p>للتحقق من عمل API، قم بزيارة <a href="/api/test">/api/test</a></p>
  </div>
</body>
</html>`;
    
    fs.writeFileSync(indexPath, indexContent);
    console.log('📄 تم إنشاء ملف index.html بسيط (لم يتم العثور على صفحة الترحيب المحسنة)');
  }

  // 5. إنشاء معلومات البناء
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
