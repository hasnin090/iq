#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 بدء عملية البناء النهائية لحل مشكلة الصفحة البيضاء...');

try {
  // 1. بناء التطبيق باستخدام Vite
  console.log('🏗️ بناء التطبيق باستخدام Vite...');
  
  try {
    console.log('📍 Working directory:', __dirname);
    execSync('npx vite build', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ تم بناء التطبيق بنجاح باستخدام Vite');
  } catch (viteError) {
    console.error('❌ فشل بناء Vite:', viteError.message);
    process.exit(1);
  }

  // 2. التحقق من وجود ملف index.html المبني
  const publicDestDir = path.join(__dirname, 'dist', 'public');
  const builtIndexPath = path.join(publicDestDir, 'index.html');
  
  console.log('📁 Checking for built index.html at:', builtIndexPath);
  
  if (!fs.existsSync(builtIndexPath)) {
    throw new Error('ملف index.html المبني غير موجود');
  }

  // 3. قراءة محتوى index.html المبني
  let builtIndexContent = fs.readFileSync(builtIndexPath, 'utf8');
  console.log('📄 تم قراءة ملف index.html المبني');

  // 4. التحقق من وجود script tag وإضافته إذا لزم الأمر
  if (!builtIndexContent.includes('<script')) {
    console.log('⚠️ لا يوجد script tag في الملف المبني، جاري إضافته...');
    
    const assetsDir = path.join(publicDestDir, 'assets');
    if (fs.existsSync(assetsDir)) {
      const assetFiles = fs.readdirSync(assetsDir);
      const mainJsFile = assetFiles.find(file => file.startsWith('index-') && file.endsWith('.js'));
      
      if (mainJsFile) {
        const scriptTag = `    <script type="module" crossorigin src="/assets/${mainJsFile}"></script>`;
        builtIndexContent = builtIndexContent.replace('</body>', `${scriptTag}\n  </body>`);
        console.log(`✅ تمت إضافة script tag: ${mainJsFile}`);
      }
    }
  } else {
    console.log('✅ script tag موجود في الملف المبني');
  }

  // 5. حفظ المحتوى المبني كـ app.html
  const appHtmlPath = path.join(publicDestDir, 'app.html');
  fs.writeFileSync(appHtmlPath, builtIndexContent);
  console.log('📄 تم حفظ التطبيق الفعلي في app.html');

  // 6. استبدال index.html بصفحة الترحيب
  const improvedWelcomePath = path.join(__dirname, 'improved-welcome-page.html');
  
  if (fs.existsSync(improvedWelcomePath)) {
    const welcomeContent = fs.readFileSync(improvedWelcomePath, 'utf8');
    fs.writeFileSync(builtIndexPath, welcomeContent);
    console.log('📄 تم استبدال index.html بصفحة الترحيب');
  } else {
    console.log('⚠️ ملف صفحة الترحيب غير موجود');
  }

  // 7. إنشاء ملف _redirects
  const redirectsContent = `# API routes to Netlify Functions
/api/*  /.netlify/functions/api/:splat  200

# التطبيق الفعلي - توجيه جميع مسارات التطبيق إلى app.html
/app  /app.html  200
/app/*  /app.html  200
/dashboard  /app.html  200
/dashboard/*  /app.html  200
/transactions  /app.html  200
/transactions/*  /app.html  200
/customers  /app.html  200
/customers/*  /app.html  200
/reports  /app.html  200
/reports/*  /app.html  200
/settings  /app.html  200
/settings/*  /app.html  200
/documents  /app.html  200
/documents/*  /app.html  200

# صفحة الترحيب - fallback
/*  /index.html  200`;

  fs.writeFileSync(path.join(publicDestDir, '_redirects'), redirectsContent);
  console.log('🔄 تم إنشاء ملف _redirects');

  // 8. التحقق النهائي
  console.log('\n🔍 فحص نهائي للملفات...');
  
  const appContent = fs.readFileSync(appHtmlPath, 'utf8');
  const hasScript = appContent.includes('<script');
  const hasRoot = appContent.includes('<div id="root">');
  
  console.log(`📄 app.html - script tag: ${hasScript ? '✅' : '❌'}`);
  console.log(`📄 app.html - root div: ${hasRoot ? '✅' : '❌'}`);
  
  const indexContent = fs.readFileSync(builtIndexPath, 'utf8');
  const isWelcomePage = indexContent.includes('الذهاب إلى التطبيق');
  
  console.log(`📄 index.html - صفحة ترحيب: ${isWelcomePage ? '✅' : '❌'}`);

  console.log('\n🎉 تم اكتمال البناء بنجاح!');
  console.log('🚀 جاهز للنشر على Netlify!');

} catch (error) {
  console.error('❌ فشل البناء:', error.message);
  console.error(error.stack);
  process.exit(1);
}
