# 🎯 دليل النشر الفوري على Netlify

## ⚡ النشر السريع

### الخطوة 1: ربط المشروع
1. اذهب إلى [netlify.com](https://netlify.com)
2. اضغط "New site from Git"
3. اختر GitHub واربط هذا المشروع: `https://github.com/hasnin090/iq`

### الخطوة 2: إعدادات البناء
```
Branch to deploy: main
Build command: npm run build:netlify
Publish directory: dist/public
Functions directory: netlify/functions
```

### الخطوة 3: متغيرات البيئة
أضف في Site settings > Environment variables:
```
NODE_VERSION=18
NODE_ENV=production
NPM_FLAGS=--production=false
```

### الخطوة 4: نشر الموقع
اضغط "Deploy site" - سيتم النشر تلقائياً!

## 🔐 تسجيل الدخول
```
اسم المستخدم: admin
كلمة المرور: admin
```

## 📁 الملفات الجاهزة
- ✅ `dist/public/` - الواجهة الأمامية
- ✅ `netlify.toml` - إعدادات Netlify  
- ✅ `_redirects` - توجيه SPA
- ✅ `package.json` - جميع التبعيات

## 🚨 إذا واجهت مشكلة

### خطأ في البناء؟
تحقق من Build log في Netlify وتأكد من:
- NODE_VERSION=18 في Environment Variables
- Build command: `npm run build:netlify`
- Publish directory: `dist/public`

### الصفحة لا تظهر؟
تحقق من:
- وجود ملف `_redirects` في `dist/public/`
- إعدادات SPA في `netlify.toml`

### الـ API لا يعمل؟
- Functions directory: `netlify/functions`
- تحقق من وجود `netlify/functions/api.ts`

## 💡 نصائح
- النشر التلقائي مفعل عند كل push
- يمكن مراقبة البناء من Netlify Dashboard
- الموقع سيحصل على رابط مجاني (.netlify.app)

---
**الحالة:** جاهز للنشر الفوري ✅
