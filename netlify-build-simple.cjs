#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Netlify Build - Simplified & Reliable');
console.log('========================================');

// Check Node.js version and warn if incompatible
const nodeVersion = process.version;
console.log(`🔍 Node.js version: ${nodeVersion}`);
console.log(`🔍 Platform: ${process.platform}`);
console.log(`🔍 Architecture: ${process.arch}`);

if (nodeVersion.startsWith('v18.')) {
  console.log('⚠️ Node.js 18 detected - using compatible Vite version');
} else if (nodeVersion.startsWith('v20.')) {
  console.log('✅ Node.js 20 detected - optimal for Vite');
}

try {
  // 0. Verify Node.js environment
  console.log('🔧 Verifying Node.js environment...');
  console.log(`📍 Current working directory: ${__dirname}`);
  console.log(`📍 Node executable: ${process.execPath}`);
  
  // Ensure we're not trying to use Python
  delete process.env.PYTHON_VERSION;
  delete process.env.PYTHON_PATH;
  console.log('🚫 Python environment variables cleared');
  
  // Check if package.json exists
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found');
  }
  console.log('✅ package.json found');
  
  // 1. Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('✅ Previous build cleaned');
  }

  // 2. Run Vite build
  console.log('🏗️ Running Vite build...');
  
  // For Node 18, use legacy Vite build approach
  if (nodeVersion.startsWith('v18.')) {
    console.log('🔧 Using Node 18 compatible build approach...');
    try {
      execSync('npm install vite@4.5.5 @vitejs/plugin-react@4.3.3 --save-dev --force', { 
        stdio: 'inherit', 
        cwd: __dirname 
      });
      console.log('✅ Installed Node 18 compatible Vite');
    } catch (error) {
      console.log('⚠️ Using existing Vite installation');
    }
  }
  
  // Try different approaches to run vite build
  const buildCommands = [
    'npm run build',
    'npx vite@4.5.5 build',
    './node_modules/.bin/vite build',
    'node ./node_modules/vite/bin/vite.js build'
  ];

  let buildSuccess = false;
  for (const buildCommand of buildCommands) {
    console.log(`📝 Trying: ${buildCommand}`);
    try {
      execSync(buildCommand, { 
        stdio: 'inherit', 
        cwd: __dirname,
        env: {
          ...process.env,
          NODE_ENV: 'production'
        }
      });
      console.log('✅ Vite build completed successfully');
      buildSuccess = true;
      break;
    } catch (error) {
      console.log(`❌ Command failed: ${buildCommand}`);
    }
  }

  if (!buildSuccess) {
    throw new Error('All build commands failed');
  }

  // 3. Verify build output
  const publicDir = path.join(__dirname, 'dist', 'public');
  if (!fs.existsSync(publicDir)) {
    throw new Error('Build output directory not found');
  }

  const indexPath = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html not found in build output');
  }

  console.log('✅ Build verification passed');

  // 4. Read built index.html
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  console.log('📄 Built index.html read successfully');

  // 5. Find main JS file
  const assetsDir = path.join(publicDir, 'assets');
  let mainJsFile = null;
  
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    mainJsFile = assetFiles.find(file => file.startsWith('index-') && file.endsWith('.js'));
    console.log(`📦 Main JS file: ${mainJsFile || 'not found'}`);
  }

  // 6. Ensure script tag exists
  if (mainJsFile && !indexContent.includes(`src="/assets/${mainJsFile}"`)) {
    console.log('⚠️ Adding missing script tag...');
    const scriptTag = `    <script type="module" crossorigin src="/assets/${mainJsFile}"></script>`;
    indexContent = indexContent.replace('</body>', `${scriptTag}\n  </body>`);
    console.log('✅ Script tag added');
  } else if (mainJsFile) {
    console.log('✅ Script tag already exists');
  }

  // 7. Create app.html (main application)
  console.log('📱 Creating app.html...');
  const appHtmlPath = path.join(publicDir, 'app.html');
  
  // Add meta tags for better SEO and functionality
  const enhancedAppContent = indexContent
    .replace('<title>نظام المحاسبة</title>', '<title>نظام المحاسبة العربي - التطبيق</title>')
    .replace('</head>', `    <meta name="description" content="نظام محاسبة عربي شامل للشركات والمؤسسات">
    <meta name="robots" content="noindex, nofollow">
    <meta name="application-name" content="نظام المحاسبة العربي">
  </head>`);
  
  fs.writeFileSync(appHtmlPath, enhancedAppContent);
  console.log('✅ app.html created');

  // 8. Create welcome page as index.html
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

  // 9. Create/update _redirects
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

  // 10. Create manifest.json for PWA
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

  // 11. Final verification
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

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
