#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Netlify Build - Final Simple Version');
console.log('=======================================');

try {
  // 1. Show environment info
  console.log(`Node version: ${process.version}`);
  console.log(`Working directory: ${__dirname}`);
  
  // 2. Clean previous builds
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  console.log('✅ Previous build cleaned');

  // 3. Simple Vite build - just use npm run build
  console.log('🏗️ Running Vite build...');
  execSync('npm run build', { 
    stdio: 'inherit', 
    cwd: __dirname,
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  console.log('✅ Vite build completed');

  // 4. Verify build output exists
  const publicDir = path.join(__dirname, 'dist', 'public');
  const indexPath = path.join(publicDir, 'index.html');
  
  if (!fs.existsSync(publicDir) || !fs.existsSync(indexPath)) {
    throw new Error('Build output verification failed');
  }
  console.log('✅ Build verification passed');

  // 5. Read built index.html
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // 6. Create app.html (main application)
  const appHtmlPath = path.join(publicDir, 'app.html');
  const enhancedAppContent = indexContent
    .replace('<title>نظام المحاسبة</title>', '<title>نظام المحاسبة العربي - التطبيق</title>');
  
  fs.writeFileSync(appHtmlPath, enhancedAppContent);
  console.log('✅ app.html created');

  // 7. Create welcome page
  const welcomeContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>نظام المحاسبة العربي</title>
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
  </style>
</head>
<body>
  <div class="container">
    <h1>🏢 نظام المحاسبة العربي</h1>
    <p>نظام محاسبة شامل ومتطور للشركات والمؤسسات العربية</p>
    <a href="/app" class="btn">🚀 الدخول إلى النظام</a>
  </div>
</body>
</html>`;

  fs.writeFileSync(indexPath, welcomeContent);
  console.log('✅ Welcome page created');

  // 8. Create _redirects
  const redirectsContent = `# API routes
/api/*  /.netlify/functions/api/:splat  200

# App routes
/app  /app.html  200
/app/*  /app.html  200

# Fallback
/*  /index.html  200`;

  fs.writeFileSync(path.join(publicDir, '_redirects'), redirectsContent);
  console.log('✅ Redirects configured');

  console.log('\n🎉 Build completed successfully!');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
