# 🔍 تشخيص مشكلة الاتصال بقاعدة البيانات

## المشكلة الحالية
تم إكمال جميع المتطلبات لكن البرنامج لا يتصل بقاعدة البيانات

## 🔧 خطوات التشخيص

### الخطوة 1: فحص Environment Variables في Netlify
1. اذهب إلى موقعك في Netlify
2. Site Settings > Environment Variables
3. تأكد من وجود هذه المتغيرات **بالضبط** (الأسماء مهمة جداً):

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY  
SUPABASE_SERVICE_ROLE_KEY
```

⚠️ **مهم جداً:** 
- تأكد من عدم وجود مسافات قبل أو بعد القيم!
- اسم المتغير الثالث يجب أن يكون `SUPABASE_SERVICE_ROLE_KEY` وليس `SUPABASE_SERVICE_ROLE`

### الخطوة 2: فحص قاعدة البيانات في Supabase
1. اذهب إلى: https://supabase.com/dashboard/project/yieyqusnciiithjtlgod
2. اضغط على **Table Editor**
3. تأكد من وجود هذه الجداول:
   - ✅ accounts
   - ✅ documents  
   - ✅ document_entries

### الخطوة 3: اختبار الاتصال
اذهب إلى موقعك وأضف `/api/db-status` للرابط:
```
https://your-site.netlify.app/api/db-status
```

## 🚨 الأخطاء الشائعة وحلولها

### خطأ: "قاعدة البيانات غير متصلة"
**السبب:** Environment Variables غير صحيحة أو مفقودة
**الحل:**
1. احذف جميع Environment Variables في Netlify
2. أضفها مرة أخرى بعناية:
   ```
   VITE_SUPABASE_URL=https://yieyqusnciiithjtlgod.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTU3MDgsImV4cCI6MjA2NjA5MTcwOH0.ZBmA3i2IMNV-EDts2vn7hOFPcfVZBwJj5htsiNmrWj8
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxNTcwOCwiZXhwIjoyMDY2MDkxNzA4fQ.TS4-OLpBAKeFlg6Br894OVqVJ988rf0ipLTJofeEOhc
   ```

### خطأ: "الجداول غير موجودة"
**السبب:** لم يتم تشغيل SQL في Supabase أو خطأ في أنواع البيانات
**الحل:**
1. اذهب إلى Supabase > SQL Editor
2. انسخ والصق هذا الكود المصحح بالكامل:

```sql
-- حذف الجداول الموجودة أولاً لتجنب تضارب الأنواع
DROP TABLE IF EXISTS document_entries CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- إنشاء جدول الحسابات
CREATE TABLE accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول المعاملات
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_number VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    total_debit DECIMAL(15,2) DEFAULT 0,
    total_credit DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول قيود اليومية
CREATE TABLE document_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    description TEXT,
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج البيانات التجريبية
INSERT INTO accounts (name, code, type) VALUES
('النقد في الصندوق', '1101', 'أصول'),
('البنك', '1102', 'أصول'),
('العملاء', '1201', 'أصول'),
('الموردين', '2101', 'خصوم'),
('رأس المال', '3101', 'حقوق الملكية'),
('إيرادات المبيعات', '4101', 'إيرادات'),
('مصروفات البيع', '5201', 'مصروفات');

-- إنشاء مستخدم تجريبي (إذا لم يكن موجود)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO users (username, name, role) VALUES
('admin', 'مدير النظام', 'admin')
ON CONFLICT (username) DO NOTHING;

-- تفعيل Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الوصول
CREATE POLICY "Allow all operations" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON document_entries FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
```

3. اضغط **RUN** وتأكد من عدم وجود أخطاء

### خطأ: "مشكلة في إعادة النشر"
**الحل:**
1. في Netlify، اذهب إلى **Deploys**
2. اضغط **Trigger deploy**
3. اختر **Clear cache and deploy site**
4. انتظر حتى ينتهي البناء (يظهر "Published")

## 🔍 فحص مفصل

### أرسل لي نتيجة هذه الاختبارات:

1. **فحص Environment Variables:**
   - اذهب إلى Netlify > Site Settings > Environment Variables
   - أرسل screenshot أو قائمة بأسماء المتغيرات الموجودة

2. **فحص Supabase Tables:**
   - اذهب إلى Supabase > Table Editor
   - أرسل screenshot للجداول الموجودة

3. **فحص API Status:**
   - اذهب إلى: `your-site.netlify.app/api/db-status`
   - أرسل الرسالة التي تظهر

4. **فحص Build Log:**
   - Netlify > Deploys > آخر deployment
   - ابحث عن أي أخطاء وأرسلها

## 🎯 حل سريع إذا لم يعمل أي شيء

1. **احذف جميع Environment Variables في Netlify**
2. **أعد إنشاء الجداول في Supabase بالكود أعلاه**
3. **أضف Environment Variables مرة أخرى بعناية**
4. **انتظر 5 دقائق ثم أعد النشر**

---

**بعد تطبيق هذه الخطوات، أخبرني بالنتائج وسأساعدك في حل أي مشكلة متبقية!**
