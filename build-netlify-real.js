#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 إنشاء النظام الحقيقي لـ Netlify...');

// إنشاء مجلدات
const distPublic = './dist/public';
const functionsDir = './dist/functions';

[distPublic, functionsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 1. نسخ ملفات الواجهة الأمامية
console.log('📁 إعداد الواجهة الأمامية...');

try {
  // قراءة وتحديث HTML
  let indexHtml = fs.readFileSync('./client/index.html', 'utf8');
  
  // تحديث HTML ليعمل على Netlify
  indexHtml = indexHtml
    .replace('/src/main.tsx', '/assets/main.js')
    .replace('<title>Vite + React + TS</title>', '<title>نظام المحاسبة العربي</title>');
  
  fs.writeFileSync(path.join(distPublic, 'index.html'), indexHtml);
  
  // نسخ ملفات public
  if (fs.existsSync('./client/public')) {
    execSync('cp -r ./client/public/* ' + distPublic + '/', { stdio: 'inherit' });
  }
  
  console.log('✅ تم إعداد ملفات الواجهة');
} catch (error) {
  console.log('⚠️ إنشاء واجهة بسيطة...');
  
  // إنشاء واجهة HTML بسيطة
  const simpleHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نظام المحاسبة العربي</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2563eb; text-align: center; margin-bottom: 30px; }
        .login-form { max-width: 400px; margin: 0 auto; }
        .form-group { margin-bottom: 20px; text-align: right; }
        label { display: block; margin-bottom: 5px; color: #333; font-weight: bold; }
        input { width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 8px; font-size: 16px; text-align: right; }
        input:focus { outline: none; border-color: #2563eb; }
        .btn { background: #2563eb; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; width: 100%; margin-top: 10px; }
        .btn:hover { background: #1d4ed8; }
        .status { padding: 15px; border-radius: 8px; margin-top: 20px; }
        .error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .success { background: #f0fdf4; color: #059669; border: 1px solid #bbf7d0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>نظام المحاسبة العربي</h1>
        <div class="login-form">
            <form id="loginForm">
                <div class="form-group">
                    <label for="username">اسم المستخدم:</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="password">كلمة المرور:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="btn">تسجيل الدخول</button>
            </form>
            <div id="status" class="status" style="display: none;"></div>
        </div>
    </div>

    <script>
        const form = document.getElementById('loginForm');
        const status = document.getElementById('status');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            status.style.display = 'block';
            status.className = 'status';
            status.textContent = 'جاري التحقق من البيانات...';
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    status.className = 'status success';
                    status.textContent = 'تم تسجيل الدخول بنجاح!';
                    localStorage.setItem('token', data.token);
                    setTimeout(() => window.location.href = '/dashboard', 1000);
                } else {
                    status.className = 'status error';
                    status.textContent = data.message || 'خطأ في تسجيل الدخول';
                }
            } catch (error) {
                status.className = 'status error';
                status.textContent = 'خطأ في الاتصال. يرجى المحاولة مرة أخرى.';
            }
        });
    </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(distPublic, 'index.html'), simpleHtml);
}

// 2. إنشاء Netlify Function حقيقية
console.log('⚙️ إنشاء API حقيقية...');

const serverCode = `const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const sql = neon(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  const { path, httpMethod, body, headers } = event;
  
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  
  try {
    console.log('API Request:', httpMethod, path);
    
    if (path.includes('/api/auth/login')) {
      if (httpMethod === 'POST') {
        const { username, password } = JSON.parse(body || '{}');
        
        if (!username || !password) {
          return createResponse(400, { message: 'البيانات مطلوبة' });
        }
        
        try {
          const [user] = await sql\`
            SELECT id, username, password, role, active 
            FROM users 
            WHERE username = \${username} AND active = true
            LIMIT 1
          \`;
          
          if (!user) {
            return createResponse(401, { message: 'اسم المستخدم غير موجود' });
          }
          
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            return createResponse(401, { message: 'كلمة المرور غير صحيحة' });
          }
          
          const token = \`token_\${user.id}_\${Date.now()}\`;
          
          return createResponse(200, {
            user: { id: user.id, username: user.username, role: user.role },
            token,
            message: 'تم تسجيل الدخول بنجاح'
          });
          
        } catch (dbError) {
          console.error('Database error:', dbError);
          return createResponse(500, { message: 'خطأ في قاعدة البيانات' });
        }
      }
    }
    
    if (path.includes('/api/health')) {
      return createResponse(200, {
        status: 'ok',
        message: 'النظام يعمل بشكل صحيح',
        timestamp: new Date().toISOString()
      });
    }
    
    if (path.includes('/api/dashboard')) {
      try {
        const [stats] = await sql\`
          SELECT 
            (SELECT COUNT(*) FROM transactions) as total_transactions,
            (SELECT COUNT(*) FROM projects WHERE active = true) as active_projects,
            (SELECT COUNT(*) FROM users WHERE active = true) as active_users
        \`;
        
        return createResponse(200, { stats });
      } catch (error) {
        return createResponse(500, { message: 'خطأ في جلب البيانات' });
      }
    }
    
    return createResponse(404, { message: 'المسار غير موجود' });
    
  } catch (error) {
    console.error('Function error:', error);
    return createResponse(500, { message: 'خطأ في الخادم' });
  }
};`;

fs.writeFileSync(path.join(functionsDir, 'server.js'), serverCode);

// 3. إنشاء package.json للـ functions
const packageJson = {
  "name": "netlify-functions",
  "version": "1.0.0",
  "dependencies": {
    "@neondatabase/serverless": "^0.10.4",
    "bcryptjs": "^2.4.3"
  }
};

fs.writeFileSync(path.join(functionsDir, 'package.json'), JSON.stringify(packageJson, null, 2));

// 4. إنشاء _redirects
const redirects = '/api/* /.netlify/functions/server/:splat 200\n/* /index.html 200';
fs.writeFileSync(path.join(distPublic, '_redirects'), redirects);

// 5. تحديث netlify.toml
const tomlConfig = `[build]
  command = "node build-netlify-real.js"
  functions = "dist/functions"
  publish = "dist/public"

[build.environment]
  NODE_VERSION = "18"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/server/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`;

fs.writeFileSync('./netlify.toml', tomlConfig);

console.log('✅ تم إنشاء النظام الحقيقي بنجاح!');
console.log('');
console.log('📋 الملفات الجاهزة:');
console.log('  ✓ dist/public/ - الواجهة الأمامية');
console.log('  ✓ dist/functions/ - APIs حقيقية');
console.log('  ✓ netlify.toml - إعدادات النشر');
console.log('');
console.log('🔧 متغيرات البيئة المطلوبة في Netlify:');
console.log('  • DATABASE_URL - رابط قاعدة البيانات');
console.log('  • NODE_ENV=production');
console.log('');
console.log('🚀 الآن يمكن رفع المشروع على Netlify!');