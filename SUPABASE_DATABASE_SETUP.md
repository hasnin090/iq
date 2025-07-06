# إعداد قاعدة بيانات Supabase - نظام المحاسبة العربي

## ✅ معلومات المشروع
- **Project Name**: accounting-system-iq
- **Project URL**: https://yieyqusnciiithjtlgod.supabase.co
- **Database**: PostgreSQL على Supabase
- **Region**: تم اختيار أفضل منطقة للعراق

## 🔑 المفاتيح المُعدة في .env
```
DATABASE_URL=postgresql://postgres:Baghdad2024%40iq@db.yieyqusnciiithjtlgod.supabase.co:5432/postgres
VITE_SUPABASE_URL=https://yieyqusnciiithjtlgod.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzY1NDksImV4cCI6MjA1MTc1MjU0OX0.XCBJzJdUKsqjdO1SdcU8WUGp0o4Q3mBGJzqFnMQ_8co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjE3NjU0OSwiZXhwIjoyMDUxNzUyNTQ5fQ.0z3aEr6U5Xo4xBB1o0xGJo-U4Q_4Z_L1rJZ6t2oRrYE
```

## 📋 خطوات إنشاء قاعدة البيانات

### 1. الوصول إلى SQL Editor
1. اذهب إلى: https://yieyqusnciiithjtlgod.supabase.co
2. سجل دخول بحسابك
3. اضغط على "SQL Editor" من القائمة الجانبية

### 2. تنفيذ سكريبت إنشاء قاعدة البيانات
انسخ والصق محتوى الملف `create-database.sql` الذي تم إنشاؤه، أو استخدم الملف `supabase-schema.sql` الموجود في المشروع.

### 3. تأكيد إنشاء الجداول
بعد تنفيذ السكريبت، تأكد من وجود الجداول التالية:
- users (المستخدمين)
- projects (المشاريع)
- transactions (المعاملات المالية)
- documents (المستندات)
- employees (الموظفين)
- expense_types (أنواع المصروفات)

## 🧪 اختبار الاتصال
```bash
npm run db:push
```

## 📁 الملفات ذات الصلة
- `.env` - متغيرات البيئة
- `supabase-schema.sql` - سكريبت إنشاء قاعدة البيانات الكامل
- `create-database.sql` - سكريبت مبسط للإنشاء
- `shared/schema.ts` - مخطط Drizzle ORM

## ⚠️ ملاحظات مهمة
- **لا تشارك Service Role Key** مع أي شخص آخر
- **احتفظ بنسخة احتياطية** من كلمة مرور قاعدة البيانات
- **تأكد من تنفيذ سكريبت قاعدة البيانات** في Supabase SQL Editor

## ✅ الحالة الحالية
- [x] مشروع Supabase منشأ
- [x] متغيرات البيئة محدثة
- [x] سكريبت قاعدة البيانات جاهز
- [ ] **يحتاج تنفيذ سكريبت في Supabase SQL Editor**

---
*تاريخ آخر تحديث: يوليو 6، 2025*
