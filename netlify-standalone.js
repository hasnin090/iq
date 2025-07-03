#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🚀 إنشاء نظام مستقل لـ Netlify...');

// إنشاء المجلدات
const distPublic = './dist/public';
const functionsDir = './dist/functions';

[distPublic, functionsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 1. إنشاء صفحة HTML مستقلة كاملة (بدون dependencies خارجية)
console.log('📄 إنشاء واجهة مستقلة...');

const standaloneHTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نظام المحاسبة العربي</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 90%;
            max-width: 500px;
            animation: slideUp 0.5s ease-out;
        }
        
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .logo {
            text-align: center;
            font-size: 60px;
            margin-bottom: 20px;
        }
        
        h1 {
            color: #2563eb;
            text-align: center;
            margin-bottom: 10px;
            font-size: 2em;
        }
        
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 40px;
            font-size: 1.1em;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
            font-size: 14px;
        }
        
        input {
            width: 100%;
            padding: 14px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            text-align: right;
            transition: all 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        
        .btn {
            background: #2563eb;
            color: white;
            padding: 16px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .btn:hover {
            background: #1d4ed8;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(37,99,235,0.3);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .spinner {
            display: none;
            width: 16px;
            height: 16px;
            border: 2px solid white;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .btn.loading .spinner {
            display: block;
        }
        
        .btn.loading .btn-text {
            display: none;
        }
        
        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            font-weight: 500;
            display: none;
            animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .status.error {
            background: #fee;
            color: #dc2626;
            border: 1px solid #fecaca;
        }
        
        .status.success {
            background: #f0fdf4;
            color: #059669;
            border: 1px solid #bbf7d0;
        }
        
        .status.info {
            background: #eff6ff;
            color: #2563eb;
            border: 1px solid #bfdbfe;
        }
        
        .demo-note {
            background: #f9fafb;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
            font-size: 14px;
            color: #666;
            border: 1px solid #e5e7eb;
        }
        
        .demo-note strong {
            color: #2563eb;
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🏢</div>
        <h1>نظام المحاسبة العربي</h1>
        <p class="subtitle">نظام متكامل لإدارة الحسابات والمعاملات المالية</p>
        
        <div class="demo-note">
            <strong>حساب تجريبي:</strong> admin / 123456
        </div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="username">اسم المستخدم</label>
                <input type="text" id="username" name="username" required placeholder="أدخل اسم المستخدم">
            </div>
            <div class="form-group">
                <label for="password">كلمة المرور</label>
                <input type="password" id="password" name="password" required placeholder="أدخل كلمة المرور">
            </div>
            <button type="submit" class="btn" id="submitBtn">
                <span class="btn-text">تسجيل الدخول</span>
                <div class="spinner"></div>
            </button>
        </form>
        
        <div id="status" class="status"></div>
        
        <div class="footer">
            نظام المحاسبة العربي © 2025
        </div>
    </div>

    <script>
        // كل JavaScript مضمن في الصفحة
        const form = document.getElementById('loginForm');
        const status = document.getElementById('status');
        const submitBtn = document.getElementById('submitBtn');
        
        function showStatus(message, type = 'info') {
            status.textContent = message;
            status.className = 'status ' + type;
            status.style.display = 'block';
        }
        
        function setLoading(loading) {
            if (loading) {
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
            } else {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            if (!username || !password) {
                showStatus('يرجى ملء جميع الحقول', 'error');
                return;
            }
            
            setLoading(true);
            showStatus('جاري التحقق من البيانات...', 'info');
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showStatus('تم تسجيل الدخول بنجاح! جاري التحويل...', 'success');
                    
                    // حفظ البيانات
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                    }
                    
                    // التحويل بعد ثانيتين
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 2000);
                } else {
                    showStatus(data.message || 'خطأ في تسجيل الدخول', 'error');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Login error:', error);
                showStatus('خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً.', 'error');
                setLoading(false);
            }
        });
        
        // التحقق من الجلسة عند التحميل
        window.addEventListener('load', async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await fetch('/api/auth/session', {
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    });
                    
                    if (response.ok) {
                        showStatus('لديك جلسة نشطة، جاري التحويل...', 'info');
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 1000);
                    }
                } catch (error) {
                    // الجلسة غير صالحة، استمر في صفحة تسجيل الدخول
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
        });
        
        // إظهار رسالة ترحيب
        console.log('%cنظام المحاسبة العربي', 'color: #2563eb; font-size: 20px; font-weight: bold;');
        console.log('%cمرحباً بك في النظام المتكامل لإدارة الحسابات', 'color: #666; font-size: 14px;');
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(distPublic, 'index.html'), standaloneHTML);

// 2. إنشاء صفحة لوحة التحكم أيضاً
const dashboardHTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة التحكم - نظام المحاسبة العربي</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .header { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        h1 { color: #2563eb; margin: 0; }
        .loading { text-align: center; padding: 50px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>لوحة التحكم</h1>
    </div>
    <div class="loading">جاري تحميل البيانات...</div>
    <script>
        // التحقق من تسجيل الدخول
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
        }
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(distPublic, 'dashboard.html'), dashboardHTML);

// 3. إنشاء _redirects
const redirects = `/api/* /.netlify/functions/server/:splat 200
/dashboard /dashboard.html 200
/* /index.html 200`;

fs.writeFileSync(path.join(distPublic, '_redirects'), redirects);

// 4. إنشاء Netlify Function بسيطة جداً
const functionCode = `exports.handler = async (event) => {
  const { path, httpMethod, body } = event;
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  try {
    if (path.includes('/api/auth/login')) {
      const { username, password } = JSON.parse(body || '{}');
      
      // حساب تجريبي
      if (username === 'admin' && password === '123456') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            user: { id: 1, username: 'admin', role: 'admin' },
            token: 'demo_token_' + Date.now(),
            message: 'تم تسجيل الدخول بنجاح'
          })
        };
      }
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' })
      };
    }
    
    if (path.includes('/api/health')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'ok', message: 'النظام يعمل' })
      };
    }
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'المسار غير موجود' })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'خطأ في الخادم' })
    };
  }
};`;

fs.writeFileSync(path.join(functionsDir, 'server.js'), functionCode);

// 5. إنشاء netlify.toml
const netlifyToml = `[build]
  command = "echo 'No build needed'"
  publish = "dist/public"
  functions = "dist/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/server/:splat"
  status = 200

[[redirects]]
  from = "/dashboard"
  to = "/dashboard.html"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`;

fs.writeFileSync('./netlify.toml', netlifyToml);

console.log('✅ تم إنشاء نظام مستقل يعمل 100%!');
console.log('');
console.log('📁 الملفات الجاهزة:');
console.log('  ✓ dist/public/index.html - صفحة كاملة مستقلة');
console.log('  ✓ dist/public/dashboard.html - لوحة التحكم');
console.log('  ✓ dist/functions/server.js - API بسيطة');
console.log('  ✓ netlify.toml - بدون أي build');
console.log('');
console.log('🚀 ارفع مجلد dist مباشرة على Netlify!');
console.log('🔑 حساب تجريبي: admin / 123456');