const fs = require('fs');
const path = require('path');

console.log('Building for Netlify...');

// Create directories
if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

if (!fs.existsSync('./netlify/functions')) {
  fs.mkdirSync('./netlify/functions', { recursive: true });
}

// Create HTML file
const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نظام المحاسبة العربي</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 90%;
            max-width: 400px;
        }
        h1 {
            color: #2563eb;
            text-align: center;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
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
            box-sizing: border-box;
        }
        input:focus {
            outline: none;
            border-color: #2563eb;
        }
        button {
            width: 100%;
            padding: 15px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        }
        button:hover {
            background: #1d4ed8;
        }
        .demo-note {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
            color: #0369a1;
        }
        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            display: none;
        }
        .error {
            background: #fee;
            color: #dc2626;
        }
        .success {
            background: #f0fdf4;
            color: #059669;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>نظام المحاسبة العربي</h1>
        <div class="demo-note">
            حساب تجريبي: admin / 123456
        </div>
        <form id="loginForm">
            <div class="form-group">
                <label>اسم المستخدم</label>
                <input type="text" id="username" required>
            </div>
            <div class="form-group">
                <label>كلمة المرور</label>
                <input type="password" id="password" required>
            </div>
            <button type="submit">تسجيل الدخول</button>
        </form>
        <div id="status" class="status"></div>
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
            status.textContent = 'جاري التحقق...';
            
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
                    if (data.token) localStorage.setItem('token', data.token);
                    setTimeout(() => window.location.href = '/', 1000);
                } else {
                    status.className = 'status error';
                    status.textContent = data.message || 'خطأ في تسجيل الدخول';
                }
            } catch (error) {
                status.className = 'status error';
                status.textContent = 'خطأ في الاتصال';
            }
        });
    </script>
</body>
</html>`;

fs.writeFileSync('./public/index.html', html);

// Create redirects
fs.writeFileSync('./public/_redirects', '/api/* /.netlify/functions/server/:splat 200\n/* /index.html 200');

// Create function
const func = `exports.handler = async (event) => {
  const { path, httpMethod, body } = event;
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };
  
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  if (path.includes('/api/auth/login')) {
    const { username, password } = JSON.parse(body || '{}');
    
    if (username === 'admin' && password === '123456') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          user: { id: 1, username: 'admin' },
          token: 'token_' + Date.now(),
          message: 'Success'
        })
      };
    }
    
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ message: 'Invalid credentials' })
    };
  }
  
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ message: 'Not found' })
  };
};`;

fs.writeFileSync('./netlify/functions/server.js', func);

console.log('Build completed!');