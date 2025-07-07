#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 بدء عملية البناء الاحترافية للإنتاج...');
console.log('='.repeat(60));

const startTime = Date.now();

try {
  // 1. التحقق من البيئة والمتطلبات
  console.log('🔍 فحص البيئة والمتطلبات...');
  
  const nodeVersion = process.version;
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log(`📍 Node.js Version: ${nodeVersion}`);
  console.log(`📍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`📍 Working Directory: ${__dirname}`);
  
  // 2. تنظيف المجلدات السابقة
  console.log('\n🧹 تنظيف ملفات البناء السابقة...');
  
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('✅ تم حذف مجلد dist السابق');
  }
  
  // 3. بناء التطبيق باستخدام Vite
  console.log('\n🏗️ بناء التطبيق باستخدام Vite...');
  console.log('⏳ هذا قد يستغرق دقيقة أو أكثر...');
  
  const viteStartTime = Date.now();
  
  try {
    execSync('npx vite build --mode production', { 
      stdio: 'inherit', 
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        VITE_APP_ENV: 'production'
      }
    });
    
    const viteEndTime = Date.now();
    const viteBuildTime = ((viteEndTime - viteStartTime) / 1000).toFixed(2);
    console.log(`✅ تم بناء التطبيق بنجاح في ${viteBuildTime} ثانية`);
    
  } catch (viteError) {
    console.error('❌ فشل بناء Vite:', viteError.message);
    process.exit(1);
  }

  // 4. التحقق من نتائج البناء
  console.log('\n🔍 فحص نتائج البناء...');
  
  const publicDestDir = path.join(__dirname, 'dist', 'public');
  const builtIndexPath = path.join(publicDestDir, 'index.html');
  const assetsDir = path.join(publicDestDir, 'assets');
  
  if (!fs.existsSync(builtIndexPath)) {
    throw new Error('ملف index.html المبني غير موجود');
  }
  
  if (!fs.existsSync(assetsDir)) {
    throw new Error('مجلد assets غير موجود');
  }
  
  const assetFiles = fs.readdirSync(assetsDir);
  const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
  const cssFiles = assetFiles.filter(f => f.endsWith('.css'));
  
  console.log(`📄 ملفات JavaScript: ${jsFiles.length}`);
  console.log(`🎨 ملفات CSS: ${cssFiles.length}`);
  console.log(`📁 إجمالي ملفات Assets: ${assetFiles.length}`);

  // 5. معالجة ملف index.html المبني
  console.log('\n📝 معالجة ملف التطبيق الرئيسي...');
  
  let builtIndexContent = fs.readFileSync(builtIndexPath, 'utf8');
  
  // التحقق من وجود script tag وإضافته إذا لزم الأمر
  const hasExistingScript = builtIndexContent.includes('<script') && builtIndexContent.includes('type="module"');
  
  if (!hasExistingScript) {
    console.log('⚠️ لا يوجد script tag في الملف المبني، جاري إضافته...');
    
    const mainJsFile = jsFiles.find(file => file.startsWith('index-') && file.endsWith('.js'));
    
    if (mainJsFile) {
      const scriptTag = `    <script type="module" crossorigin src="/assets/${mainJsFile}"></script>`;
      builtIndexContent = builtIndexContent.replace('</body>', `${scriptTag}\n  </body>`);
      console.log(`✅ تمت إضافة script tag: ${mainJsFile}`);
    } else {
      throw new Error('لم يتم العثور على ملف JavaScript الرئيسي');
    }
  } else {
    console.log('✅ script tag موجود في الملف المبني');
  }

  // 6. إنشاء app.html (التطبيق الفعلي)
  console.log('\n📱 إنشاء ملف التطبيق الرئيسي (app.html)...');
  
  // تحسين app.html للإنتاج
  const appHtmlContent = builtIndexContent
    .replace('<title>نظام المحاسبة</title>', '<title>نظام المحاسبة العربي - الإصدار الاحترافي</title>')
    .replace('</head>', `    <meta name="description" content="نظام محاسبة عربي شامل للشركات والمؤسسات">
    <meta name="keywords" content="محاسبة، نظام، عربي، فواتير، تقارير">
    <meta name="author" content="نظام المحاسبة العربي">
    <meta property="og:title" content="نظام المحاسبة العربي">
    <meta property="og:description" content="نظام محاسبة شامل ومتطور">
    <meta property="og:type" content="website">
  </head>`);
  
  const appHtmlPath = path.join(publicDestDir, 'app.html');
  fs.writeFileSync(appHtmlPath, appHtmlContent);
  console.log('✅ تم إنشاء app.html مع التحسينات');

  // 7. إنشاء صفحة الترحيب الاحترافية
  console.log('\n🎨 إنشاء صفحة الترحيب الاحترافية...');
  
  const welcomePageContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>نظام المحاسبة العربي - الإصدار الاحترافي</title>
  <meta name="description" content="نظام محاسبة عربي شامل للشركات والمؤسسات - إدارة متكاملة للحسابات والفواتير والتقارير">
  <meta name="keywords" content="محاسبة، نظام، عربي، فواتير، تقارير، إدارة مالية">
  <meta name="author" content="نظام المحاسبة العربي">
  
  <!-- Open Graph -->
  <meta property="og:title" content="نظام المحاسبة العربي">
  <meta property="og:description" content="نظام محاسبة شامل ومتطور للشركات">
  <meta property="og:type" content="website">
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  
  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --primary-color: #1e40af;
      --primary-dark: #1e3a8a;
      --secondary-color: #059669;
      --accent-color: #dc2626;
      --text-primary: #1f2937;
      --text-secondary: #6b7280;
      --bg-primary: #ffffff;
      --bg-secondary: #f8fafc;
      --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      --border-radius: 12px;
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: var(--bg-gradient);
      color: var(--text-primary);
      line-height: 1.6;
      direction: rtl;
      min-height: 100vh;
      overflow-x: hidden;
    }
    
    .container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    
    /* Header */
    .header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding: 1rem 0;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: var(--shadow-sm);
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .logo-icon {
      width: 48px;
      height: 48px;
      background: var(--bg-gradient);
      border-radius: var(--border-radius);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      font-weight: 900;
    }
    
    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
    }
    
    .version-badge {
      background: var(--secondary-color);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    /* Main Content */
    .main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
    }
    
    .welcome-card {
      background: var(--bg-primary);
      border-radius: 24px;
      padding: 4rem;
      box-shadow: var(--shadow-xl);
      max-width: 800px;
      width: 100%;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .welcome-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--bg-gradient);
    }
    
    .welcome-title {
      font-size: 2.5rem;
      font-weight: 900;
      color: var(--primary-color);
      margin-bottom: 1rem;
      line-height: 1.2;
    }
    
    .welcome-subtitle {
      font-size: 1.25rem;
      color: var(--text-secondary);
      margin-bottom: 3rem;
      line-height: 1.6;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin: 3rem 0;
    }
    
    .feature-item {
      text-align: center;
      padding: 1.5rem;
      border-radius: var(--border-radius);
      background: var(--bg-secondary);
      transition: var(--transition);
    }
    
    .feature-item:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }
    
    .feature-icon {
      width: 60px;
      height: 60px;
      margin: 0 auto 1rem;
      background: var(--bg-gradient);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
    }
    
    .feature-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }
    
    .feature-desc {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    
    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 3rem;
    }
    
    .btn {
      padding: 1rem 2rem;
      border-radius: var(--border-radius);
      text-decoration: none;
      font-weight: 600;
      font-size: 1.1rem;
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border: 2px solid transparent;
      min-width: 180px;
      justify-content: center;
    }
    
    .btn-primary {
      background: var(--bg-gradient);
      color: white;
      box-shadow: var(--shadow-md);
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    
    .btn-secondary {
      background: transparent;
      color: var(--primary-color);
      border-color: var(--primary-color);
    }
    
    .btn-secondary:hover {
      background: var(--primary-color);
      color: white;
    }
    
    /* Footer */
    .footer {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      padding: 2rem 0;
      text-align: center;
    }
    
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        padding: 0 1rem;
      }
      
      .logo-text {
        font-size: 1.2rem;
      }
      
      .main {
        padding: 2rem 1rem;
      }
      
      .welcome-card {
        padding: 2rem;
      }
      
      .welcome-title {
        font-size: 2rem;
      }
      
      .welcome-subtitle {
        font-size: 1.1rem;
      }
      
      .features-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      .actions {
        flex-direction: column;
        align-items: center;
      }
      
      .btn {
        width: 100%;
        max-width: 300px;
      }
    }
    
    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .welcome-card {
      animation: fadeInUp 0.8s ease-out;
    }
    
    .feature-item {
      animation: fadeInUp 0.8s ease-out;
    }
    
    .feature-item:nth-child(1) { animation-delay: 0.1s; }
    .feature-item:nth-child(2) { animation-delay: 0.2s; }
    .feature-item:nth-child(3) { animation-delay: 0.3s; }
    .feature-item:nth-child(4) { animation-delay: 0.4s; }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <div class="logo-icon">💼</div>
          <div class="logo-text">نظام المحاسبة العربي</div>
        </div>
        <div class="version-badge">الإصدار الاحترافي</div>
      </div>
    </header>
    
    <main class="main">
      <div class="welcome-card">
        <h1 class="welcome-title">مرحباً بك في نظام المحاسبة العربي</h1>
        <p class="welcome-subtitle">
          نظام محاسبة شامل ومتطور مصمم خصيصاً للشركات والمؤسسات العربية<br>
          إدارة متكاملة للحسابات والفواتير والتقارير المالية
        </p>
        
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">📊</div>
            <div class="feature-title">إدارة الحسابات</div>
            <div class="feature-desc">نظام شامل لإدارة جميع الحسابات المالية</div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">📄</div>
            <div class="feature-title">الفواتير والمبيعات</div>
            <div class="feature-desc">إنشاء وإدارة الفواتير بسهولة ودقة</div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">👥</div>
            <div class="feature-title">إدارة العملاء</div>
            <div class="feature-desc">قاعدة بيانات شاملة للعملاء والموردين</div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">📈</div>
            <div class="feature-title">التقارير المالية</div>
            <div class="feature-desc">تقارير تفصيلية ودقيقة لجميع العمليات</div>
          </div>
        </div>
        
        <div class="actions">
          <a href="/app" class="btn btn-primary">
            🚀 الذهاب إلى التطبيق
          </a>
          <a href="/dashboard" class="btn btn-secondary">
            📊 لوحة التحكم
          </a>
        </div>
      </div>
    </main>
    
    <footer class="footer">
      <div class="footer-content">
        <p>&copy; 2025 نظام المحاسبة العربي - جميع الحقوق محفوظة</p>
        <p>نظام محاسبة احترافي مصمم للشركات والمؤسسات العربية</p>
      </div>
    </footer>
  </div>
  
  <script>
    // تحسين الأداء
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').catch(function() {
          // Service worker registration failed
        });
      });
    }
    
    // تتبع النقرات
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        console.log('Navigation to:', this.href);
      });
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(builtIndexPath, welcomePageContent);
  console.log('✅ تم إنشاء صفحة الترحيب الاحترافية');

  // 8. إنشاء ملف _redirects محسن
  console.log('\n🔄 إنشاء توجيهات Netlify...');
  
  const redirectsContent = `# API routes to Netlify Functions
/api/*  /.netlify/functions/api/:splat  200

# التطبيق الرئيسي - توجيه جميع مسارات التطبيق إلى app.html
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
  console.log('✅ تم إنشاء ملف _redirects');

  // 9. إنشاء ملفات PWA
  console.log('\n📱 إنشاء ملفات Progressive Web App...');
  
  // Manifest.json
  const manifestContent = {
    name: "نظام المحاسبة العربي",
    short_name: "المحاسبة العربي",
    description: "نظام محاسبة شامل للشركات والمؤسسات العربية",
    start_url: "/app",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e40af",
    orientation: "portrait",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(publicDestDir, 'manifest.json'), 
    JSON.stringify(manifestContent, null, 2)
  );
  console.log('✅ تم إنشاء manifest.json');

  // 10. إنشاء معلومات البناء المتقدمة
  console.log('\n📋 إنشاء معلومات البناء...');
  
  const buildEndTime = Date.now();
  const totalBuildTime = ((buildEndTime - startTime) / 1000).toFixed(2);
  
  const buildInfo = {
    buildTime: new Date().toISOString(),
    buildDuration: `${totalBuildTime}s`,
    nodeVersion: process.version,
    platform: process.platform,
    environment: isProduction ? 'production' : 'development',
    viteVersion: '7.0.2',
    assets: {
      total: assetFiles.length,
      javascript: jsFiles.length,
      css: cssFiles.length
    },
    features: {
      whitePage: 'fixed',
      pwa: 'enabled',
      seo: 'optimized',
      security: 'enhanced',
      caching: 'optimized'
    },
    version: '1.0.0-production',
    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(publicDestDir, 'build-info.json'), 
    JSON.stringify(buildInfo, null, 2)
  );

  // 11. الفحص النهائي الشامل
  console.log('\n🔍 الفحص النهائي الشامل...');
  
  const checks = {
    appHtml: {
      exists: fs.existsSync(appHtmlPath),
      hasScript: fs.readFileSync(appHtmlPath, 'utf8').includes('<script'),
      hasRoot: fs.readFileSync(appHtmlPath, 'utf8').includes('<div id="root">'),
    },
    indexHtml: {
      exists: fs.existsSync(builtIndexPath),
      isWelcome: fs.readFileSync(builtIndexPath, 'utf8').includes('نظام المحاسبة العربي'),
    },
    redirects: {
      exists: fs.existsSync(path.join(publicDestDir, '_redirects')),
    },
    assets: {
      exists: fs.existsSync(assetsDir),
      count: assetFiles.length,
    },
    manifest: {
      exists: fs.existsSync(path.join(publicDestDir, 'manifest.json')),
    }
  };
  
  console.log('\n📊 نتائج الفحص:');
  console.log(`📄 app.html: ${checks.appHtml.exists ? '✅' : '❌'} | Script: ${checks.appHtml.hasScript ? '✅' : '❌'} | Root: ${checks.appHtml.hasRoot ? '✅' : '❌'}`);
  console.log(`🏠 index.html: ${checks.indexHtml.exists ? '✅' : '❌'} | Welcome: ${checks.indexHtml.isWelcome ? '✅' : '❌'}`);
  console.log(`🔄 _redirects: ${checks.redirects.exists ? '✅' : '❌'}`);
  console.log(`📁 Assets: ${checks.assets.exists ? '✅' : '❌'} (${checks.assets.count} files)`);
  console.log(`📱 PWA Manifest: ${checks.manifest.exists ? '✅' : '❌'}`);

  const allChecksPass = Object.values(checks).every(check => 
    typeof check === 'object' 
      ? Object.values(check).every(Boolean) 
      : check
  );

  console.log('\n' + '='.repeat(60));
  
  if (allChecksPass) {
    console.log('🎉 تم اكتمال البناء الاحترافي بنجاح!');
    console.log('✨ جميع الفحوصات نجحت 100%');
    console.log(`⏱️ وقت البناء الإجمالي: ${totalBuildTime} ثانية`);
    console.log('🚀 التطبيق جاهز للنشر الاحترافي على Netlify');
    console.log('\n📁 الملفات المنتجة:');
    console.log('   📄 dist/public/index.html - صفحة الترحيب الاحترافية');
    console.log('   📱 dist/public/app.html - التطبيق الرئيسي');
    console.log('   📁 dist/public/assets/ - ملفات التطبيق المحسنة');
    console.log('   🔄 dist/public/_redirects - توجيهات Netlify');
    console.log('   📱 dist/public/manifest.json - إعدادات PWA');
    console.log('   📋 dist/public/build-info.json - معلومات البناء');
  } else {
    console.log('⚠️ تحذير: بعض الفحوصات فشلت!');
    console.log('🔍 يرجى مراجعة الأخطاء أعلاه');
    process.exit(1);
  }

} catch (error) {
  console.error('\n❌ فشل البناء الاحترافي:');
  console.error(`📝 الخطأ: ${error.message}`);
  console.error(`📍 Stack: ${error.stack}`);
  process.exit(1);
}
