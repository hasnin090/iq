# 🔑 متغيرات البيئة لـ Netlify - Environment Variables for Netlify
# نسخ هذه المتغيرات إلى Netlify Dashboard

## المتغيرات الأساسية - Core Variables

### 1. رابط قاعدة البيانات - Database URL
SUPABASE_DATABASE_URL=https://yieyqusnciiithjtlgod.supabase.co

### 2. المفتاح العام - Anonymous Key
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTU3MDgsImV4cCI6MjA2NjA5MTcwOH0.ZBmA3i2IMNV-EDts2vn7hOFPcfVZBwJj5htsiNmrWj8

### 3. مفتاح الخدمة - Service Role Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxNTcwOCwiZXhwIjoyMDY2MDkxNzA4fQ.TS4-OLpBAKeFlg6Br894OVqVJ988rf0ipLTJofeEOc

### 4. مفتاح JWT - JWT Secret
SUPABASE_JWT_SECRET=dNmjU9X/A9eEJgIyIlUh3GEq24xtilXdTYQbCNBluQ57k3pkWvej4HcQZhA3+E4B+zSlHMtBysQwMKwO5Iwi8w==

## المتغيرات العامة - Public Variables

### 5. رابط قاعدة البيانات العام - Public Database URL
PUBLIC_SUPABASE_DATABASE_URL=https://yieyqusnciiithjtlgod.supabase.co

### 6. المفتاح العام - Public Anonymous Key
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTU3MDgsImV4cCI6MjA2NjA5MTcwOH0.ZBmA3i2IMNV-EDts2vn7hOFPcfVZBwJj5htsiNmrWj8

---

## 📋 خطوات الإعداد في Netlify:

1. اذهب إلى Netlify Dashboard
2. اختر موقعك
3. Site Settings → Environment Variables
4. أضف كل متغير بالضغط على "Add variable"
5. انسخ الاسم والقيمة من الأعلى
6. احفظ التغييرات
7. اضغط "Trigger deploy" لإعادة النشر

## ✅ النتيجة المتوقعة:
بعد إعداد المتغيرات، ستظهر في logs البناء:
✅ SUPABASE_DATABASE_URL: configured
✅ SUPABASE_SERVICE_ROLE_KEY: configured  
✅ SUPABASE_ANON_KEY: configured
✅ SUPABASE_JWT_SECRET: configured
✅ PUBLIC_SUPABASE_DATABASE_URL: configured
✅ PUBLIC_SUPABASE_ANON_KEY: configured
