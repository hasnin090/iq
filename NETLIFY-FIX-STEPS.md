# 🚀 خطوات حل مشكلة Netlify - نسخة مبسطة

## الملفات المطلوب رفعها إلى Netlify:

### 1. `netlify.toml` (في جذر المشروع)
```toml
[build]
  command = "npm run build"
  publish = "dist/public"
  functions = "dist/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@neondatabase/serverless", "pg", "postgres"]
```

### 2. `dist/functions/api.js` (ملف API المبسط)
تم إنشاء هذا الملف وهو موجود في: `dist/functions/api.js`

### 3. البنية المطلوبة:
```
your-netlify-project/
├── netlify.toml
├── dist/
│   ├── public/          (ملفات الواجهة الأمامية)
│   └── functions/
│       └── api.js       (ملف API الجديد)
└── package.json
```

## خطوات الحل:

### 1️⃣ حمّل الملفات المحدثة
```bash
# حمّل ملف API الجديد
cp dist/functions/api.js your-netlify-repo/dist/functions/

# حمّل netlify.toml المحدث
cp netlify.toml your-netlify-repo/
```

### 2️⃣ في Netlify Dashboard
- Site Settings > Environment Variables
- أضف:
```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
SESSION_SECRET=your-32-character-or-longer-secret-key
```

### 3️⃣ انشر التحديثات
```bash
git add .
git commit -m "Fix Netlify API routes"
git push
```

### 4️⃣ اختبر بعد النشر
1. `https://your-site.netlify.app/.netlify/functions/api/database/status`
2. `https://your-site.netlify.app/.netlify/functions/api/auth/login`

## إذا لم تعمل:

### جرب Vercel بدلاً من Netlify:
```bash
# 1. ثبّت Vercel CLI
npm i -g vercel

# 2. انشر المشروع
vercel

# 3. أضف المتغيرات البيئية في Vercel Dashboard
```

## المساعدة
إذا استمرت المشكلة، أرسل:
1. رابط موقعك على Netlify
2. محتوى Function logs من Netlify Dashboard
3. أي رسائل خطأ تظهر في المتصفح