# إصلاح مشكلة 404 في Netlify API

## المشكلة
كانت طلبات `/api/*` تعطي خطأ 404 Not Found في Netlify.

## الحل المُطبق

### 1. إنشاء دالة Netlify Functions
- تم إنشاء ملف `netlify/functions/api.js` للتعامل مع جميع طلبات API
- الدالة تتعامل مع CORS وتوجيه الطلبات
- تدعم جميع HTTP methods (GET, POST, PUT, DELETE, OPTIONS)

### 2. تحديث ملف netlify.toml
```toml
[build]
  publish = "dist/public"
  command = "npm install && npm run build:netlify"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[context.production.environment]
  NODE_ENV = "production"

[build.processing]
  skip_processing = false

# API routes redirect to Netlify functions (يجب أن يكون أولاً)
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

# Redirect all other requests to index.html for SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. تحديث ملف _redirects
```
# API routes to Netlify Functions
/api/*  /.netlify/functions/api/:splat  200

# SPA fallback for React Router
/*  /index.html  200
```

### 4. تحديث سكريبت البناء
- `netlify-supabase-build.js` يتأكد من وجود دالة API
- ينسخ ملف `_redirects` إلى مجلد الإخراج
- ينشئ معلومات البناء

### 5. دالة API الرئيسية
الدالة في `netlify/functions/api.js` تقوم بـ:
- إعداد Express app مع CORS
- تحميل routes من server/index.ts
- التعامل مع طلبات API وتوجيهها
- إرجاع responses صحيحة

## التحقق من الإصلاح

### اختبارات محلية
```bash
# بناء المشروع
npm run build:netlify

# التحقق من وجود الملفات
ls netlify/functions/api.js
ls dist/public/_redirects
```

### اختبارات بعد النشر
```bash
# اختبار health check
curl https://your-site.netlify.app/api/health

# اختبار API عام
curl https://your-site.netlify.app/api/test
```

## الملفات المُحدثة
1. `netlify/functions/api.js` - دالة API الرئيسية
2. `netlify.toml` - تكوين Netlify
3. `_redirects` و `public/_redirects` - توجيه الطلبات
4. `netlify-supabase-build.js` - سكريبت البناء
5. `server/index.ts` - إضافة دالة createServer

## خطوات النشر
1. تأكد من commit جميع التغييرات
2. push إلى repository
3. Netlify سيقوم بالبناء تلقائياً
4. اختبر `/api/health` للتأكد من العمل

## استكشاف الأخطاء
- تحقق من Netlify Build Logs
- تحقق من Function Logs في Netlify Dashboard
- تأكد من أن `netlify/functions/api.js` موجود بعد البناء
- تأكد من أن `_redirects` في `dist/public`

## ملاحظات مهمة
- دالة API تدعم timeout 25 ثانية
- CORS مُفعل لجميع origins
- يتم تسجيل جميع الطلبات في logs
- fallback routes متوفرة في حالة عدم تحميل server routes
