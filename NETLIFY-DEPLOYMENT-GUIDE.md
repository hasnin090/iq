# 🚀 دليل نشر النظام على Netlify

## ⚠️ المشكلة الحالية
تظهر رسالة خطأ 404 عند محاولة تسجيل الدخول على Netlify.

## 🔧 الحل السريع

### 1. تحقق من بنية المشروع
تأكد من وجود الملفات التالية في مشروع Netlify:
```
dist/
├── public/           # ملفات الواجهة الأمامية
├── functions/        # دوال Netlify
│   └── server-simple.js
└── package.json      # ملف التبعيات
```

### 2. إعداد Netlify
في **Netlify Dashboard > Site Settings**:

#### Build & Deploy > Build settings:
- **Build command**: `npm run build`
- **Publish directory**: `dist/public`
- **Functions directory**: `dist/functions`

#### Environment variables:
أضف المتغيرات التالية:
```
DATABASE_URL=postgresql://your_username:your_password@your_host:5432/your_database?sslmode=require
SESSION_SECRET=your_random_session_secret_here
```

### 3. اختبار الوظائف
بعد النشر، اختبر الروابط التالية:
- `https://your-site.netlify.app/.netlify/functions/server-simple/health`
- `https://your-site.netlify.app/.netlify/functions/test-function`

### 4. إذا استمرت المشكلة

#### أ. استخدم Netlify CLI:
```bash
# تثبيت Netlify CLI
npm install -g netlify-cli

# تسجيل الدخول
netlify login

# اختبار محلي
netlify dev

# النشر
netlify deploy --prod
```

#### ب. فحص السجلات:
- **Functions tab** في Netlify Dashboard
- ابحث عن أخطاء في Function logs

### 5. البديل - استخدام Vercel
إذا لم تنجح مع Netlify، جرب Vercel:

1. أنشئ ملف `vercel.json`:
```json
{
  "functions": {
    "api/index.js": {
      "runtime": "@vercel/node@20"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

2. أنشئ `api/index.js`:
```javascript
import app from '../dist/index.js';
export default app;
```

3. انشر على Vercel:
```bash
npm i -g vercel
vercel
```

## 📝 ملاحظات مهمة
- تأكد من أن `serverless-http` مثبت في package.json
- تأكد من أن الملف `server-simple.js` يُصدّر `handler`
- استخدم Node.js 18 أو أحدث

## 🔍 تشخيص المشكلة
إذا رأيت خطأ 404:
1. تحقق من وجود الملف في `dist/functions/`
2. تحقق من أن Functions directory صحيح في Netlify settings
3. تحقق من Function logs للأخطاء
4. جرب رابط مباشر: `/.netlify/functions/server-simple/health`

## 🆘 الدعم
إذا استمرت المشكلة:
1. شارك محتوى Function logs
2. شارك محتوى Deploy log
3. تأكد من أن جميع المتغيرات البيئية مضافة