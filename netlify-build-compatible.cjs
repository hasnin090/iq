#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Netlify Build - Node.js Compatible Version');
console.log('==============================================');

try {
  // 1. Environment check
  console.log('🔍 Environment Info:');
  console.log(`Node version: ${process.version}`);
  console.log(`Working directory: ${__dirname}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

  // 2. Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('✅ Previous build cleaned');
  }

  // 3. Install dependencies with force if needed
  console.log('📦 Ensuring dependencies...');
  try {
    execSync('npm list vite', { stdio: 'pipe', cwd: __dirname });
    console.log('✅ Vite already installed');
  } catch (error) {
    console.log('⚠️ Installing Vite and dependencies...');
    execSync('npm install --force', { stdio: 'inherit', cwd: __dirname });
  }

  // 4. Use Vite 5.x compatible with Node 18
  console.log('🔧 Checking Vite compatibility...');
  const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
  
  if (nodeVersion < 20) {
    console.log('⚠️ Node.js < 20 detected, downgrading Vite...');
    execSync('npm install vite@^5.4.10 @vitejs/plugin-react@^4.3.3 --save-dev --force', { 
      stdio: 'inherit', 
      cwd: __dirname 
    });
  }

  // 5. Build with fallback methods
  console.log('🏗️ Running Vite build...');
  
  const buildCommands = [
    'npm run build',
    'npx vite build',
    './node_modules/.bin/vite build',
    'node ./node_modules/vite/bin/vite.js build'
  ];

  let buildSuccess = false;
  
  for (let i = 0; i < buildCommands.length; i++) {
    const command = buildCommands[i];
    console.log(`📝 Trying (${i + 1}/${buildCommands.length}): ${command}`);
    
    try {
      execSync(command, { 
        stdio: 'inherit', 
        cwd: __dirname,
        env: {
          ...process.env,
          NODE_ENV: 'production'
        }
      });
      console.log('✅ Build completed successfully');
      buildSuccess = true;
      break;
    } catch (error) {
      console.log(`❌ Command failed: ${command}`);
      if (i === buildCommands.length - 1) {
        console.log('Error:', error.message);
      }
    }
  }

  if (!buildSuccess) {
    throw new Error('All build commands failed');
  }

  // 6. Verify build output
  const publicDir = path.join(__dirname, 'dist', 'public');
  if (!fs.existsSync(publicDir)) {
    throw new Error('Build output directory not found');
  }

  const indexPath = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html not found in build output');
  }

  console.log('✅ Build verification passed');

  // 7. Post-process files (same as before)
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  console.log('📄 Built index.html read successfully');

  // 8. Find main JS file
  const assetsDir = path.join(publicDir, 'assets');
  let mainJsFile = null;
  
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    mainJsFile = assetFiles.find(file => file.startsWith('index-') && file.endsWith('.js'));
    console.log(`📦 Main JS file: ${mainJsFile || 'not found'}`);
  }

  // 9. Create app.html (main application)
  console.log('📱 Creating app.html...');
  const appHtmlPath = path.join(publicDir, 'app.html');
  
  const enhancedAppContent = indexContent
    .replace('<title>نظام المحاسبة</title>', '<title>نظام المحاسبة العربي - التطبيق</title>')
    .replace('</head>', `    <meta name="description" content="نظام محاسبة عربي شامل للشركات والمؤسسات">
    <meta name="robots" content="noindex, nofollow">
    <meta name="application-name" content="نظام المحاسبة العربي">
  </head>`);
  
  fs.writeFileSync(appHtmlPath, enhancedAppContent);
  console.log('✅ app.html created');

  // 10. Create welcome page as index.html
  console.log('🎨 Creating welcome page...');
  const welcomeContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>نظام المحاسبة العربي - مرحباً بك</title>
  <meta name="description" content="نظام محاسبة عربي شامل للشركات والمؤسسات">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      direction: rtl;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      padding: 3rem;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 500px;
      width: 90%;
    }
    h1 { color: #1e40af; margin-bottom: 1rem; font-size: 2rem; }
    p { margin-bottom: 2rem; color: #666; line-height: 1.6; }
    .btn {
      background: #1e40af;
      color: white;
      padding: 15px 30px;
      border: none;
      border-radius: 50px;
      font-size: 1.1rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: all 0.3s;
    }
    .btn:hover { background: #1e3a8a; transform: translateY(-2px); }
    .features {
      margin-top: 2rem;
      text-align: right;
    }
    .feature {
      margin: 0.5rem 0;
      color: #059669;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏢 نظام المحاسبة العربي</h1>
    <p>نظام محاسبة شامل ومتطور للشركات والمؤسسات العربية</p>
    
    <a href="/app" class="btn">🚀 الدخول إلى النظام</a>
    
    <div class="features">
      <div class="feature">✅ إدارة الحسابات والمعاملات</div>
      <div class="feature">✅ تقارير مالية متقدمة</div>
      <div class="feature">✅ إدارة العملاء والموردين</div>
      <div class="feature">✅ نظام فواتير احترافي</div>
      <div class="feature">✅ دعم كامل للغة العربية</div>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(indexPath, welcomeContent);
  console.log('✅ Welcome page created');

  // 11. Create/update _redirects
  console.log('🔄 Setting up redirects...');
  const redirectsContent = `# API routes
/api/*  /.netlify/functions/api/:splat  200

# App routes - direct to app.html
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

# Fallback to welcome page
/*  /index.html  200`;

  fs.writeFileSync(path.join(publicDir, '_redirects'), redirectsContent);
  console.log('✅ Redirects configured');

  // 12. Create manifest.json for PWA
  console.log('📱 Creating PWA manifest...');
  const manifest = {
    name: "نظام المحاسبة العربي",
    short_name: "المحاسبة",
    description: "نظام محاسبة شامل للشركات",
    start_url: "/app",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e40af",
    lang: "ar",
    dir: "rtl"
  };

  fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('✅ PWA manifest created');

  // 13. Final verification
  console.log('🔍 Final verification...');
  
  const appContent = fs.readFileSync(appHtmlPath, 'utf8');
  const hasScript = appContent.includes('<script type="module"');
  const hasRoot = appContent.includes('<div id="root">');
  
  console.log(`✅ app.html has script tag: ${hasScript}`);
  console.log(`✅ app.html has root div: ${hasRoot}`);
  
  if (!hasScript || !hasRoot) {
    throw new Error('app.html validation failed');
  }

  console.log('\n🎉 Build completed successfully!');
  console.log('📁 Output: dist/public');
  console.log('🌐 Ready for Netlify deployment');
  console.log(`📊 Node.js version used: ${process.version}`);

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
