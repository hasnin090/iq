# 🔍 تشخيص مشكلة اتصال قاعدة البيانات

## 📋 قائمة فحص سريعة

### 1. فحص Environment Variables في Netlify
اذهب إلى موقعك في Netlify > Site Settings > Environment Variables وتأكد من وجود:

```
✅ VITE_SUPABASE_URL = https://yieyqusnciiithjtlgod.supabase.co
✅ VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. فحص قاعدة البيانات في Supabase
اذهب إلى https://supabase.com/dashboard/project/yieyqusnciiithjtlgod
- Table Editor > تأكد من وجود: accounts, documents, document_entries, users

### 3. اختبار الاتصال
اذهب إلى: `https://your-site.netlify.app/api/db-status`

## 🚨 رسائل الخطأ الشائعة وحلولها

### "قاعدة البيانات غير متصلة"
**السبب:** Environment Variables غير موجودة
**الحل:**
1. تأكد من إضافة المتغيرات الثلاثة في Netlify
2. أعد نشر الموقع بعد إضافة المتغيرات

### "الجداول غير موجودة"  
**السبب:** SQL لم يُشغل في Supabase
**الحل:**
1. اذهب إلى Supabase > SQL Editor
2. انسخ والصق SQL المحدث من `QUICK_SUPABASE_SETUP.md`
3. اضغط RUN

### "Invalid API key"
**السبب:** مفاتيح API خاطئة
**الحل:**
1. انسخ المفاتيح مرة أخرى من Supabase > Settings > API
2. استبدل القيم في Netlify Environment Variables
3. أعد النشر

## 🔧 خطوات الإصلاح السريع

### الخطوة 1: إعادة تشغيل SQL في Supabase
```sql
-- احذف الجداول الموجودة أولاً (إذا وُجدت)
DROP TABLE IF EXISTS document_entries CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ثم أنشئ الجداول من جديد باستخدام SQL من QUICK_SUPABASE_SETUP.md
```

### الخطوة 2: إعادة إنشاء Environment Variables
1. احذف جميع Environment Variables الموجودة في Netlify
2. أضفها مرة أخرى واحدة تلو الأخرى
3. تأكد من عدم وجود مسافات زائدة

### الخطوة 3: Clear Cache وإعادة النشر
1. Netlify > Deploys > Trigger deploy
2. اختر "Clear cache and deploy site"
3. انتظر حتى ينتهي البناء

### الخطوة 4: اختبار مباشر
```
اذهب إلى: https://your-site.netlify.app/api/accounts
يجب أن ترى: قائمة بالحسابات المحاسبية

اذهب إلى: https://your-site.netlify.app/api/documents  
يجب أن ترى: قائمة بالقيود المحاسبية
```

## ⚡ اختبار سريع للحلول

### اختبار 1: API Status
```
URL: /api/db-status
المتوقع: "قاعدة البيانات متصلة وتعمل بشكل طبيعي"
```

### اختبار 2: الحسابات
```  
URL: /api/accounts
المتوقع: قائمة بالحسابات مثل "النقد في الصندوق"
```

### اختبار 3: القيود
```
URL: /api/documents
المتوقع: قائمة بالقيود المحاسبية
```

## 📞 إذا لم تعمل الحلول

**أرسل لي:**
1. نتيجة `/api/db-status`
2. رسالة الخطأ (إن وُجدت)
3. لقطة شاشة من Environment Variables في Netlify
4. لقطة شاشة من Table Editor في Supabase

---
**آخر تحديث:** July 5, 2025
**الحالة:** محدث مع API endpoints جديدة
