# تحديث مفاتيح Supabase - يونيو 2025

## 🚨 المشكلة الحالية
المفاتيح الموجودة في ملف `SUPABASE_DATABASE_SETUP.md` لا تعمل حالياً. نحصل على خطأ "Invalid API key" عند محاولة الاتصال بـ Supabase.

## 🔍 السبب المحتمل
- المشروع في Supabase قد يكون محذوفاً أو معطّلاً
- المفاتيح قد تكون منتهية الصلاحية
- قد تكون هناك مشكلة في إعدادات المشروع

## ✅ الحل المؤقت
النظام يعمل حالياً على قاعدة بيانات SQLite المحلية بشكل مثالي:
- قاعدة البيانات: `database.db`
- المستخدم الافتراضي: `admin` / `admin123`
- جميع الجداول موجودة ومهيأة

## 🔧 خطوات لتحديث مفاتيح Supabase

### 1. إنشاء مشروع جديد في Supabase
1. اذهب إلى: https://supabase.com/dashboard
2. اضغط على "New project"
3. اختر اسم المشروع: `accounting-system-iq`
4. اختر منطقة قريبة من العراق

### 2. الحصول على المفاتيح الجديدة
1. اذهب إلى Settings > API
2. انسخ المفاتيح التالية:
   - `Project URL`
   - `anon public key`
   - `service_role key`

### 3. تحديث ملف .env
```bash
# استبدل هذه القيم بالمفاتيح الجديدة
VITE_SUPABASE_URL=https://jcoekbaahgjympmnuilr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjb2VrYmFhaGdqeW1wbW51aWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNTA1MDcsImV4cCI6MjA2NzYyNjUwN30.CGwebOhh_c4buoX_Uh111zzo8H3p4Ak_p3v3V0LcjRA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjb2VrYmFhaGdqeW1wbW51aWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA1MDUwNywiZXhwIjoyMDY3NjI2NTA3fQ.3D8EFs03XOVrGy8edoMm_nr8gEYtLJFzhD-je1yMo0Q

# وحدّث DATABASE_URL
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

### 4. إنشاء الجداول في Supabase
1. اذهب إلى SQL Editor في Supabase
2. انسخ والصق محتوى `supabase-schema.sql`
3. اضغط RUN

### 5. اختبار الاتصال
```bash
npm run db:push
node simple-test.cjs
```

## 📊 الحالة الحالية
- [x] النظام يعمل على SQLite محلياً
- [x] واجهة تسجيل الدخول تعمل
- [x] جميع الجداول موجودة
- [x] المستخدم الافتراضي مُعدّ
- [ ] **مطلوب: تحديث مفاتيح Supabase**
- [ ] **مطلوب: إنشاء الجداول في Supabase**

## 🎯 للمتابعة
1. احصل على مفاتيح Supabase جديدة
2. حدّث ملف `.env`
3. قم بتنفيذ `npm run db:push`
4. اختبر الاتصال بـ `node simple-test.cjs`

---
*تاريخ التحديث: يونيو 9، 2025*
