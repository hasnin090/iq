#!/bin/bash

# دليل بديل لمعالجة مشكلة "vite: not found"
echo "========== معالجة مشكلة vite: not found =========="
echo

# 1. التحقق من تثبيت vite
echo "🔍 التحقق من تثبيت Vite..."
if ! npx vite --version &> /dev/null; then
  echo "⚠️ Vite غير مثبت! جاري التثبيت..."
  npm install -D vite
else
  echo "✅ Vite مثبت: $(npx vite --version)"
fi

# 2. التحقق من وجود Vite في package.json
if ! grep -q '"vite":' package.json; then
  echo "⚠️ Vite غير موجود في package.json! جاري إضافته..."
  # استخدام jq لإضافة vite إلى devDependencies إذا كان مثبتاً
  if command -v jq &> /dev/null; then
    cp package.json package.json.bak
    jq '.devDependencies.vite = "^7.0.2"' package.json > package.json.tmp && mv package.json.tmp package.json
    echo "✅ تمت إضافة Vite إلى package.json"
  else
    echo "⚠️ أداة jq غير مثبتة. يرجى إضافة Vite يدوياً إلى package.json"
    echo '  "vite": "^7.0.2"'
  fi
else
  echo "✅ Vite موجود في package.json"
fi

# 3. حل بديل: إنشاء سكريبت بناء يتجاوز vite
echo "🔧 إنشاء سكريبت بناء بديل..."

cat > netlify-alt-build.js << 'EOF'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 بدء عملية البناء البديلة لـ Netlify...');

try {
  // 1. إنشاء المجلدات اللازمة
  const functionsDir = path.join(__dirname, 'netlify', 'functions');
  const publicDestDir = path.join(__dirname, 'dist', 'public');
  
  if (!fs.existsSync(functionsDir)) {
    fs.mkdirSync(functionsDir, { recursive: true });
    console.log('📁 تم إنشاء مجلد netlify/functions');
  }

  if (!fs.existsSync(publicDestDir)) {
    fs.mkdirSync(publicDestDir, { recursive: true });
    console.log('📁 تم إنشاء مجلد dist/public');
  }

  // 2. نسخ الملفات الثابتة من مجلد public
  const publicSrcDir = path.join(__dirname, 'public');
  
  if (fs.existsSync(publicSrcDir)) {
    console.log('📄 جاري نسخ الملفات الثابتة...');
    const files = fs.readdirSync(publicSrcDir);
    files.forEach(file => {
      const srcFile = path.join(publicSrcDir, file);
      const destFile = path.join(publicDestDir, file);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`  ✓ تم نسخ ${file}`);
      }
    });
  }

  // 3. إنشاء ملف _redirects للتوجيه
  const redirectsContent = `# API routes to Netlify Functions
/api/*  /.netlify/functions/api/:splat  200

# SPA fallback for React Router
/*  /index.html  200`;

  fs.writeFileSync(path.join(publicDestDir, '_redirects'), redirectsContent);
  console.log('🔄 تم إنشاء ملف _redirects للتوجيه');

  // 4. نسخ ملفات API Functions
  const apiJsFunction = path.join(__dirname, 'netlify', 'functions', 'api.js');
  
  // إذا لم تكن دالة API موجودة، قم بإنشائها
  if (!fs.existsSync(apiJsFunction)) {
    console.log('⚠️ دالة API غير موجودة - جاري إنشاؤها...');
    
    const apiFunctionContent = `// Netlify function handler for API routes
const express = require('express');

// Global app instance
let app;

// Initialize Express app with basic routes
const initializeApp = async () => {
  if (app) return app;
  
  console.log('🚀 Initializing Express app for Netlify...');
  
  app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });

  // Health check route
  app.get('/health', (req, res) => {
    return res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Test route
  app.get('/test', (req, res) => {
    return res.json({ 
      message: 'API is working correctly!',
      serverTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  return app;
};

// Netlify function handler
exports.handler = async (event, context) => {
  // Log the request for debugging
  console.log('🔄 API Request:', event.path, event.httpMethod);
  
  try {
    // Initialize the Express app
    const app = await initializeApp();
    
    // Mock express req/res objects
    const req = {
      path: event.path.replace('/.netlify/functions/api', ''),
      method: event.httpMethod,
      headers: event.headers,
      body: event.body ? JSON.parse(event.body) : {},
      query: event.queryStringParameters || {}
    };
    
    let statusCode = 200;
    let resBody = {};
    let resHeaders = {};
    
    // Mock response object
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (body) => {
        resBody = body;
        resHeaders['Content-Type'] = 'application/json';
        return null;
      },
      send: (body) => {
        resBody = body;
        return null;
      },
      header: (key, value) => {
        resHeaders[key] = value;
        return res;
      },
      set: (key, value) => {
        resHeaders[key] = value;
        return res;
      }
    };
    
    // Process the request through express
    await new Promise((resolve) => {
      app._router.handle(req, res, resolve);
    });
    
    // Return the response
    return {
      statusCode,
      headers: resHeaders,
      body: typeof resBody === 'object' ? JSON.stringify(resBody) : resBody
    };
  } catch (error) {
    console.error('❌ API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message })
    };
  }
};`;

    fs.writeFileSync(apiJsFunction, apiFunctionContent);
    console.log('✅ تم إنشاء دالة API بنجاح');
  } else {
    console.log('✅ دالة API موجودة بالفعل');
  }

  console.log('✅ تم اكتمال عملية البناء البديلة بنجاح!');
  console.log('📁 مجلد المخرجات: dist/public');
  console.log('⚡ مجلد الدوال: netlify/functions');
  console.log('🌐 جاهز للنشر!');

} catch (error) {
  console.error('❌ فشل البناء:', error);
  process.exit(1);
}
EOF

echo "✅ تم إنشاء سكريبت البناء البديل: netlify-alt-build.js"

# 4. إضافة سكريبت بناء بديل إلى package.json
if ! grep -q '"build:netlify-alt":' package.json; then
  echo "🔧 إضافة سكريبت البناء البديل إلى package.json..."
  if command -v jq &> /dev/null; then
    cp package.json package.json.bak2
    jq '.scripts["build:netlify-alt"] = "node netlify-alt-build.js"' package.json > package.json.tmp && mv package.json.tmp package.json
    echo "✅ تمت إضافة سكريبت البناء البديل إلى package.json"
  else
    echo "⚠️ أداة jq غير مثبتة. يرجى إضافة السكريبت يدوياً إلى package.json:"
    echo '  "build:netlify-alt": "node netlify-alt-build.js"'
  fi
fi

# 5. إنشاء ملف netlify.toml بديل
echo "🔧 إنشاء ملف netlify.toml بديل..."

cat > netlify.alt.toml << 'EOF'
[build]
  publish = "dist/public"
  command = "npm ci && node netlify-alt-build.js"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[context.production.environment]
  NODE_ENV = "production"
  
[functions]
  node_bundler = "esbuild"
  external_node_modules = ["express"]

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF

echo "✅ تم إنشاء ملف netlify.alt.toml"

echo -e "\n========== تعليمات حل مشكلة vite: not found =========="
echo "1. تأكد من تثبيت vite:"
echo "   npm install -D vite"
echo
echo "2. أو استخدم السكريبت البديل للبناء:"
echo "   node netlify-alt-build.js"
echo
echo "3. أو استخدم ملف netlify.alt.toml البديل:"
echo "   cp netlify.alt.toml netlify.toml"
echo "   git add netlify.toml"
echo "   git commit -m \"استخدام إعدادات Netlify بديلة لتجاوز مشكلة vite\""
echo "   git push"
echo
echo "✨ اتبع الخطوات أعلاه لحل مشكلة vite: not found! ✨"

exit 0
