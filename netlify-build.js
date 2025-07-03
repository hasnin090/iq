#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Building for Netlify deployment...');

// Create directories
const publicDir = './public';
const functionsDir = './netlify/functions';

[publicDir, functionsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create the HTML file
const indexHTML = `<!DOCTYPE html>
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
    </div>

    <script>
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
                    
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                    }
                    
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
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'index.html'), indexHTML);

// Create _redirects file
const redirects = `/api/* /.netlify/functions/server/:splat 200
/* /index.html 200`;

fs.writeFileSync(path.join(publicDir, '_redirects'), redirects);

// Create the Netlify function
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

console.log('✅ Build completed successfully!');
console.log('Files created:');
console.log('  - public/index.html');
console.log('  - public/_redirects');
console.log('  - netlify/functions/server.js');