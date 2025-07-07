# 📋 دليل إعداد متغيرات البيئة في Netlify
# Netlify Environment Variables Setup Guide

## 🚀 الخطوات المطلوبة:

### الخطوة 1: الوصول إلى إعدادات Netlify
1. اذهب إلى [Netlify Dashboard](https://app.netlify.com/)
2. اختر موقعك من القائمة
3. اضغط على **"Site settings"**
4. من القائمة الجانبية، اختر **"Environment variables"**

### الخطوة 2: إضافة المتغيرات

اضغط على **"Add variable"** لكل متغير وأدخل:

#### المتغير الأول:
- **Key**: `SUPABASE_DATABASE_URL`
- **Value**: `https://yieyqusnciiithjtlgod.supabase.co`

#### المتغير الثاني:
- **Key**: `SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTU3MDgsImV4cCI6MjA2NjA5MTcwOH0.ZBmA3i2IMNV-EDts2vn7hOFPcfVZBwJj5htsiNmrWj8`

#### المتغير الثالث:
- **Key**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxNTcwOCwiZXhwIjoyMDY2MDkxNzA4fQ.TS4-OLpBAKeFlg6Br894OVqVJ988rf0ipLTJofeEOc`

#### المتغير الرابع:
- **Key**: `SUPABASE_JWT_SECRET`
- **Value**: `dNmjU9X/A9eEJgIyIlUh3GEq24xtilXdTYQbCNBluQ57k3pkWvej4HcQZhA3+E4B+zSlHMtBysQwMKwO5Iwi8w==`

#### المتغير الخامس:
- **Key**: `PUBLIC_SUPABASE_DATABASE_URL`
- **Value**: `https://yieyqusnciiithjtlgod.supabase.co`

#### المتغير السادس:
- **Key**: `PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTU3MDgsImV4cCI6MjA2NjA5MTcwOH0.ZBmA3i2IMNV-EDts2vn7hOFPcfVZBwJj5htsiNmrWj8`

### الخطوة 3: حفظ المتغيرات
- تأكد من حفظ كل متغير بعد إدخاله
- لا تترك مسافات في بداية أو نهاية القيم

### الخطوة 4: إعادة النشر
- اضغط على **"Trigger deploy"** لإعادة نشر الموقع
- أو انتظر النشر التلقائي إذا كان مفعلاً

## ✅ التحقق من النجاح:

بعد إعادة النشر، ستظهر هذه الرسائل في Build logs:

```
✅ SUPABASE_DATABASE_URL: configured
✅ SUPABASE_SERVICE_ROLE_KEY: configured  
✅ SUPABASE_ANON_KEY: configured
✅ SUPABASE_JWT_SECRET: configured
✅ PUBLIC_SUPABASE_DATABASE_URL: configured
✅ PUBLIC_SUPABASE_ANON_KEY: configured
✅ All Supabase environment variables are configured
```

## 🔧 في حالة وجود مشاكل:

### إذا ظهرت متغيرات مفقودة:
1. تأكد من الأسماء مطابقة تماماً (case-sensitive)
2. تأكد من عدم وجود مسافات إضافية
3. تأكد من حفظ جميع المتغيرات

### إذا فشل البناء:
1. راجع Build logs للمزيد من التفاصيل
2. تأكد من أن جميع المتغيرات مضبوطة
3. جرب إعادة النشر مرة أخرى

## 📞 للمساعدة:
إذا واجهت أي مشاكل، تأكد من:
- نسخ المتغيرات بالضبط كما هي مكتوبة
- عدم تغيير أسماء المتغيرات
- حفظ جميع المتغيرات قبل إعادة النشر

---

## 🔒 ملاحظة أمنية:
هذا الملف يحتوي على مفاتيح حساسة. تأكد من:
- عدم مشاركة هذه المفاتيح مع أشخاص غير مخولين
- حذف هذا الملف بعد إعداد المتغيرات
- إعادة إنشاء المفاتيح إذا تم تسريبها
