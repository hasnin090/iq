# دليل إصلاح مشكلة 404 في Netlify

هذا الملف يحتوي على تعليمات لتشخيص وإصلاح مشكلة 404 (صفحة غير موجودة) في موقع Netlify.

## 🔍 أسباب محتملة لمشكلة 404

عند ظهور رسالة "Page not found" في موقع Netlify، قد تكون الأسباب:

1. **مشاكل في ملفات التوجيه _redirects**:
   - عدم وجود ملف _redirects في مجلد النشر
   - عدم تكوين توجيه API بشكل صحيح

2. **مشاكل في إعدادات netlify.toml**:
   - عدم وجود قسم [[redirects]] أو تكوينه بشكل غير صحيح
   - تعارض بين إعدادات redirects في الملفات المختلفة

3. **مشاكل في دوال Netlify Functions**:
   - عدم وجود مجلد netlify/functions في المشروع
   - عدم وجود دالة api.js أو عدم تكوينها بشكل صحيح

4. **مشاكل في عملية البناء**:
   - فشل نسخ ملفات _redirects إلى مجلد النشر
   - مسار النشر غير صحيح في إعدادات Netlify

## ✅ حلول تم تنفيذها

تم إنشاء سكريبت `fix-netlify-404.sh` يقوم بالخطوات التالية:

1. **إصلاح ملفات _redirects**:
   - التحقق من وجود ملفات _redirects في المجلد الرئيسي و public/
   - إنشاء ملفات _redirects بالمحتوى الصحيح إذا كانت مفقودة
   - التأكد من وجود توجيه API صحيح في ملفات _redirects

2. **إصلاح دالة API**:
   - التحقق من وجود مجلد netlify/functions ودالة api.js
   - إنشاء دالة API كاملة إذا كانت مفقودة

3. **إصلاح ملف netlify.toml**:
   - التحقق من وجود ملف netlify.toml وإعدادات البناء الصحيحة
   - إضافة توجيه API إذا كان مفقوداً

4. **تحسين عملية البناء**:
   - إنشاء سكريبت بناء بديل يتجاوز المشاكل المحتملة
   - إجراء بناء تجريبي للتأكد من وجود جميع الملفات في مجلد النشر

## 🚀 كيفية استخدام الحلول

1. **تنفيذ سكريبت الإصلاح الشامل**:
   ```bash
   ./fix-netlify-404.sh
   ```

2. **التحقق من البناء المحلي**:
   ```bash
   node netlify-alt-build.js
   ```

3. **دفع التغييرات إلى GitHub**:
   ```bash
   git add .
   git commit -m "إصلاح شامل لمشكلة 404 في Netlify"
   git push
   ```

4. **التحقق من النشر في Netlify**:
   - زيارة لوحة تحكم Netlify
   - التحقق من سجلات البناء
   - اختبار الموقع بعد النشر

## 📄 إعدادات هامة

### توجيه API الصحيح (في _redirects)
```
/api/*  /.netlify/functions/api/:splat  200
```

### توجيه SPA (في _redirects)
```
/*  /index.html  200
```

### إعدادات Netlify.toml
```toml
[build]
  publish = "dist/public"
  command = "npm ci && node netlify-alt-build.js"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🔄 التحقق من الإصلاح

بعد النشر، يمكن التحقق من عمل الموقع والـ API بزيارة:
- الصفحة الرئيسية: `https://[your-site].netlify.app/`
- اختبار API: `https://[your-site].netlify.app/api/test`
- فحص الصحة: `https://[your-site].netlify.app/api/health`
