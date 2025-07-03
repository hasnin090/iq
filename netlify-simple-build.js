#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🚀 إنشاء نسخة مبسطة لـ Netlify...');

// إنشاء مجلد dist/public
const distPublic = './dist/public';
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}
if (!fs.existsSync(distPublic)) {
  fs.mkdirSync(distPublic, { recursive: true });
}

// إنشاء صفحة HTML رئيسية تعمل
const indexHtml = `<!DOCTYPE html>
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
        }
        .container { 
            background: white; 
            padding: 40px; 
            border-radius: 15px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 90%;
            text-align: center;
        }
        h1 { 
            color: #2563eb; 
            margin-bottom: 20px; 
            font-size: 2.5em;
            font-weight: bold;
        }
        p { 
            color: #666; 
            line-height: 1.8; 
            margin-bottom: 20px;
            font-size: 1.1em;
        }
        .login-form {
            margin-top: 30px;
        }
        .form-group {
            margin-bottom: 20px;
            text-align: right;
        }
        label {
            display: block;
            margin-bottom: 5px;
            color: #333;
            font-weight: bold;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            text-align: right;
        }
        input:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .btn {
            background: #2563eb;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
            transition: background 0.3s;
        }
        .btn:hover {
            background: #1d4ed8;
        }
        .status {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            border-right: 4px solid #10b981;
        }
        .error {
            border-right-color: #ef4444;
            background: #fef2f2;
            color: #dc2626;
        }
        .success {
            border-right-color: #10b981;
            background: #f0fdf4;
            color: #059669;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏢</h1>
        <h1>نظام المحاسبة العربي</h1>
        <p>نظام متكامل لإدارة الحسابات والمعاملات المالية</p>
        
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
            
            <div id="status" class="status" style="display: none;">
                جاري التحقق من البيانات...
            </div>
        </div>
    </div>

    <script>
        const form = document.getElementById('loginForm');
        const status = document.getElementById('status');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // إظهار حالة التحميل
            status.style.display = 'block';
            status.className = 'status';
            status.textContent = 'جاري التحقق من البيانات...';
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                });
                
                if (response.ok) {
                    status.className = 'status success';
                    status.textContent = 'تم تسجيل الدخول بنجاح! جاري التحويل...';
                    
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 2000);
                } else {
                    throw new Error('فشل في تسجيل الدخول');
                }
            } catch (error) {
                status.className = 'status error';
                status.textContent = 'خطأ في الاتصال. يرجى المحاولة مرة أخرى.';
            }
        });
        
        // محاولة التحقق من الجلسة الحالية
        async function checkSession() {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    if (data.user) {
                        window.location.href = '/dashboard';
                    }
                }
            } catch (error) {
                // لا توجد جلسة نشطة
            }
        }
        
        checkSession();
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(distPublic, 'index.html'), indexHtml);

// إنشاء ملف _redirects
const redirectsContent = `/api/* /.netlify/functions/server/:splat 200
/* /index.html 200`;

fs.writeFileSync(path.join(distPublic, '_redirects'), redirectsContent);

// إنشاء netlify function مبسط
const functionsDir = './dist/functions';
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
}

const serverFunction = `// Netlify function للنظام
exports.handler = async (event, context) => {
    const { path, httpMethod, body, headers } = event;
    
    // إعداد CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // التعامل مع OPTIONS requests
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }
    
    try {
        // مسارات API الأساسية
        if (path.includes('/api/auth/login')) {
            if (httpMethod === 'POST') {
                const { username, password } = JSON.parse(body);
                
                // بيانات تجريبية للاختبار
                if (username === 'admin' && password === '123456') {
                    return {
                        statusCode: 200,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            user: { id: 1, username: 'admin', role: 'admin' },
                            message: 'تم تسجيل الدخول بنجاح'
                        })
                    };
                } else {
                    return {
                        statusCode: 401,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: 'بيانات خاطئة' })
                    };
                }
            }
        }
        
        if (path.includes('/api/auth/session')) {
            return {
                statusCode: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: null })
            };
        }
        
        if (path.includes('/api/health')) {
            return {
                statusCode: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: 'ok', 
                    message: 'النظام يعمل بشكل صحيح',
                    timestamp: new Date().toISOString()
                })
            };
        }
        
        // مسار افتراضي
        return {
            statusCode: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'المسار غير موجود' })
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: 'خطأ في الخادم', 
                error: error.message 
            })
        };
    }
};`;

fs.writeFileSync(path.join(functionsDir, 'server.js'), serverFunction);

// إنشاء package.json للـ functions
const functionPackageJson = {
  "name": "netlify-functions",
  "version": "1.0.0",
  "main": "server.js"
};

fs.writeFileSync(path.join(functionsDir, 'package.json'), JSON.stringify(functionPackageJson, null, 2));

// تحديث netlify.toml
const netlifyConfig = `[build]
  command = "node netlify-simple-build.js"
  functions = "dist/functions"
  publish = "dist/public"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/server/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  node_bundler = "esbuild"`;

fs.writeFileSync('./netlify.toml', netlifyConfig);

console.log('✅ تم إنشاء النسخة المبسطة بنجاح!');
console.log('');
console.log('📁 الملفات جاهزة:');
console.log('  - dist/public/index.html (صفحة تسجيل الدخول)');
console.log('  - dist/functions/server.js (API مبسط)');
console.log('  - netlify.toml (إعدادات محدثة)');
console.log('');
console.log('🔑 بيانات الاختبار:');
console.log('  المستخدم: admin');
console.log('  كلمة المرور: 123456');
console.log('');
console.log('🚀 الآن يمكنك رفع المشروع على Netlify!');