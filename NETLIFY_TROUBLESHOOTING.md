# Arabic Accounting System - Netlify Deployment Guide

## إعدادات النشر على Netlify

### 1. إعدادات البناء الأساسية

**Build Settings في Netlify Dashboard:**
```
Repository: https://github.com/hasnin090/iq
Branch: main
Base directory: (اتركه فارغ)
Build command: npm run build:netlify
Publish directory: dist/public
Functions directory: netlify/functions
```

### 2. متغيرات البيئة (Environment Variables)

في Netlify Dashboard > Site Settings > Environment Variables:

```bash
NODE_VERSION=18
NODE_ENV=production
NPM_FLAGS=--production=false
SKIP_PREFLIGHT_CHECK=true
CI=false
```

### 3. تحقق من الملفات المطلوبة

تأكد من وجود الملفات التالية في repository:

✅ `netlify.toml` - إعدادات Netlify
✅ `package.json` - تبعيات المشروع  
✅ `vite.config.ts` - إعدادات Vite
✅ `dist/public/index.html` - الصفحة الرئيسية
✅ `dist/public/_redirects` - توجيه SPA
✅ `netlify/functions/api.ts` - دوال الواجهة الخلفية

### 4. خطوات استكشاف الأخطاء

إذا لم يعمل النشر:

1. **تحقق من Build Log في Netlify:**
   - اذهب إلى Deploys tab
   - اضغط على آخر deployment
   - تحقق من البناء log

2. **تحقق من أن البناء يعمل محلياً:**
   ```bash
   npm run build:netlify
   ```

3. **تحقق من أن الملفات موجودة:**
   ```bash
   ls -la dist/public/
   ```

### 5. مشاكل شائعة وحلولها

**مشكلة: "Command failed"**
- تأكد من أن NODE_VERSION=18 في Environment Variables
- تأكد من أن جميع التبعيات موجودة في package.json

**مشكلة: "Page not found"**
- تحقق من وجود ملف _redirects في dist/public/
- تحقق من إعدادات SPA في netlify.toml

**مشكلة: "Build directory not found"**
- تأكد من أن Publish directory مضبوط على: `dist/public`
- تحقق من أن البناء ينتج الملفات في المكان الصحيح

### 6. ملف netlify.toml المحدث

```toml
[build]
  publish = "dist/public"
  command = "npm install && npm run build:netlify"
  functions = "netlify/functions"
  base = "."

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--production=false"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### 7. تسجيل الدخول التجريبي

بعد النشر الناجح:
- اسم المستخدم: `admin`
- كلمة المرور: `admin`

---

**تاريخ التحديث:** July 5, 2025
**الحالة:** جاهز للنشر الإنتاجي
