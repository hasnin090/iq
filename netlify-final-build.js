import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 بدء عملية البناء النهائية لحل مشكلة الصفحة البيضاء...');

try {
  // 1. بناء التطبيق باستخدام Vite
  console.log('🏗️ بناء التطبيق باستخدام Vite...');
  
  try {
    console.log('📍 Working directory:', __dirname);
    console.log('📍 Running command: npx vite build');
    execSync('npx vite build', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ تم بناء التطبيق بنجاح باستخدام Vite');
  } catch (viteError) {
    console.error('❌ فشل بناء Vite:', viteError.message);
    console.error('Stack:', viteError.stack);
    process.exit(1);
  }

  // 2. التحقق من وجود ملف index.html المبني
  const publicDestDir = path.join(__dirname, 'dist', 'public');
  const builtIndexPath = path.join(publicDestDir, 'index.html');
  
  if (!fs.existsSync(builtIndexPath)) {
    throw new Error('ملف index.html المبني غير موجود');
  }

  // 3. قراءة محتوى index.html المبني (يحتوي على جميع السكريبتات)
  let builtIndexContent = fs.readFileSync(builtIndexPath, 'utf8');
  console.log('📄 تم قراءة ملف index.html المبني');

  // 4. التحقق من وجود script tag في الملف المبني
  if (!builtIndexContent.includes('<script')) {
    console.log('⚠️ لا يوجد script tag في الملف المبني، جاري إضافته...');
    
    // البحث عن ملف JavaScript الرئيسي
    const assetsDir = path.join(publicDestDir, 'assets');
    if (fs.existsSync(assetsDir)) {
      const assetFiles = fs.readdirSync(assetsDir);
      const mainJsFile = assetFiles.find(file => file.startsWith('index-') && file.endsWith('.js'));
      
      if (mainJsFile) {
        // إضافة script tag قبل </body>
        const scriptTag = `    <script type="module" crossorigin src="/assets/${mainJsFile}"></script>`;
        builtIndexContent = builtIndexContent.replace('</body>', `${scriptTag}\n  </body>`);
        console.log(`✅ تمت إضافة script tag: ${mainJsFile}`);
      }
    }
  }

  // 5. حفظ المحتوى المبني كـ app.html (التطبيق الفعلي)
  const appHtmlPath = path.join(publicDestDir, 'app.html');
  fs.writeFileSync(appHtmlPath, builtIndexContent);
  console.log('📄 تم حفظ التطبيق الفعلي في app.html');

  // 6. إنشاء صفحة الترحيب المحسنة وحفظها كـ index.html
  const improvedWelcomePath = path.join(__dirname, 'improved-welcome-page.html');
  
  if (fs.existsSync(improvedWelcomePath)) {
    const welcomeContent = fs.readFileSync(improvedWelcomePath, 'utf8');
    fs.writeFileSync(builtIndexPath, welcomeContent);
    console.log('📄 تم استبدال index.html بصفحة الترحيب');
  } else {
    console.log('⚠️ ملف صفحة الترحيب غير موجود، سيتم الاحتفاظ بـ index.html الأصلي');
  }

  // 7. إنشاء ملف _redirects محسن
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
  console.log('🔄 تم إنشاء ملف _redirects محسن');

  // 8. إنشاء معلومات البناء
  const buildInfo = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'production',
    fixApplied: 'white-page-fix',
    description: 'تم حل مشكلة الصفحة البيضاء عبر التأكد من وجود script tags في app.html'
  };

  fs.writeFileSync(
    path.join(publicDestDir, 'build-info.json'), 
    JSON.stringify(buildInfo, null, 2)
  );

  // 9. التحقق النهائي من صحة الملفات
  console.log('\n🔍 فحص نهائي للملفات...');
  
  // فحص app.html
  const appContent = fs.readFileSync(appHtmlPath, 'utf8');
  const hasScript = appContent.includes('<script');
  const hasRoot = appContent.includes('<div id="root">');
  
  console.log(`📄 app.html - يحتوي على script: ${hasScript ? '✅' : '❌'}`);
  console.log(`📄 app.html - يحتوي على root div: ${hasRoot ? '✅' : '❌'}`);
  
  // فحص index.html
  const indexContent = fs.readFileSync(builtIndexPath, 'utf8');
  const isWelcomePage = indexContent.includes('صفحة الترحيب') || indexContent.includes('الذهاب إلى التطبيق');
  
  console.log(`📄 index.html - صفحة ترحيب: ${isWelcomePage ? '✅' : '❌'}`);
  
  // فحص الـ assets
  const assetsDir = path.join(publicDestDir, 'assets');
  const hasAssets = fs.existsSync(assetsDir) && fs.readdirSync(assetsDir).length > 0;
  
  console.log(`📁 assets - موجودة: ${hasAssets ? '✅' : '❌'}`);

  if (hasScript && hasRoot && isWelcomePage && hasAssets) {
    console.log('\n🎉 تم اكتمال البناء بنجاح! جميع الفحوصات نجحت.');
    console.log('📝 التطبيق جاهز للنشر على Netlify');
    console.log('🔗 عند الضغط على "الذهاب إلى التطبيق" سيتم توجيهك إلى app.html');
  } else {
    console.log('\n⚠️ تحذير: بعض الفحوصات فشلت، قد تحتاج لمراجعة إضافية');
  }

  console.log('\n📁 مجلد المخرجات: dist/public');
  console.log('⚡ مجلد الدوال: netlify/functions');
  console.log('🌐 جاهز للنشر!');

} catch (error) {
  console.error('❌ فشل البناء:', error.message);
  console.error(error.stack);
  process.exit(1);
}
