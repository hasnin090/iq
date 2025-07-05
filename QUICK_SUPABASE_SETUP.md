# 🚀 دليل الربط السريع بـ Supabase

## خطوات سريعة (5 دقائق)

### 1. إنشاء Supabase Project
```
1. اذهب إلى supabase.com
2. اضغط "New Project"  
3. اختر اسم: نظام المحاسبة العربي
4. اختر كلمة مرور قوية
5. اختر المنطقة الأقرب لك
6. انتظر 2-3 دقائق
```

### 2. نسخ معلومات الاتصال ✅
```
من Settings > API في Supabase:

Project URL: https://yieyqusnciiithjtlgod.supabase.co  
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTU3MDgsImV4cCI6MjA2NjA5MTcwOH0.ZBmA3i2IMNV-EDts2vn7hOFPcfVZBwJj5htsiNmrWj8
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9zZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxNTcwOCwiZXhwIjoyMDY2MDkxNzA4fQ.TS4-OLpBAKeFlg6Br894OVqVJ988rf0ipLTJofeEOhc
```

### 3. تشغيل Database Schema المحدث
```sql
-- انسخ والصق في SQL Editor:

-- إنشاء جدول الحسابات
CREATE TABLE accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول المعاملات/الوثائق
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
    credit DECIMAL(15,2) DEFAULT 0
);

-- إنشاء جدول المستخدمين
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج بيانات تجريبية للحسابات
INSERT INTO accounts (name, code, type) VALUES
('النقد في الصندوق', '1101', 'أصول'),
('البنك', '1102', 'أصول'),
('العملاء', '1201', 'أصول'),
('الموردين', '2101', 'خصوم'),
('رأس المال', '3101', 'حقوق الملكية'),
('الأرباح المحتجزة', '3201', 'حقوق الملكية'),
('إيرادات المبيعات', '4101', 'إيرادات'),
('تكلفة البضاعة المباعة', '5101', 'مصروفات'),
('مصروفات البيع والتوزيع', '5201', 'مصروفات'),
('مصروفات إدارية', '5301', 'مصروفات');

-- إدراج مستخدم تجريبي
INSERT INTO users (username, name, role) VALUES
('admin', 'مدير النظام', 'admin');

-- إدراج قيد تجريبي
INSERT INTO documents (document_number, date, description, total_debit, total_credit) VALUES
('DOC-001', CURRENT_DATE, 'قيد افتتاحي', 10000, 10000);

-- قيود اليومية للقيد التجريبي
INSERT INTO document_entries (document_id, account_id, description, debit, credit) VALUES
((SELECT id FROM documents WHERE document_number = 'DOC-001'), 
 (SELECT id FROM accounts WHERE code = '1101'), 
 'نقد في الصندوق', 5000, 0),
((SELECT id FROM documents WHERE document_number = 'DOC-001'), 
 (SELECT id FROM accounts WHERE code = '1102'), 
 'رصيد البنك', 5000, 0),
((SELECT id FROM documents WHERE document_number = 'DOC-001'), 
 (SELECT id FROM accounts WHERE code = '3101'), 
 'رأس المال الافتتاحي', 0, 10000);

-- تفعيل Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول (للتجربة - تسمح بالوصول للجميع)
CREATE POLICY "Allow all operations on accounts" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations on documents" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all operations on document_entries" ON document_entries FOR ALL USING (true);
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
```

### 4. تحديث Netlify Environment Variables ✅
```
Site Settings > Environment variables:

VITE_SUPABASE_URL=https://yieyqusnciiithjtlgod.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NTA1MTU3MDgsImV4cCI6MjA2NjA5MTcwOH0.ZBmA3i2IMNV-EDts2vn7hOFPcfVZBwJj5htsiNmrWj8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9zZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxNTcwOCwiZXhwIjoyMDY2MDkxNzA4fQ.TS4-OLpBAKeFlg6Br894OVqVJ988rf0ipLTJofeEOhc
```

### 5. إعادة نشر الموقع
```
Deploys > Trigger deploy > Deploy site
```

## 🎯 النتيجة المتوقعة

بعد هذه الخطوات:
- ✅ نظام المحاسبة متصل بقاعدة البيانات
- ✅ يمكن إنشاء قيود محاسبية
- ✅ البيانات تُحفظ في Supabase
- ✅ يمكن مراجعة دفتر الأستاذ

## 🔧 اختبار سريع

1. **سجل دخول:** admin/admin
2. **اذهب إلى دفتر الأستاذ**
3. **أنشئ قيد جديد:**
   ```
   من حساب: النقد في الصندوق (مدين 1000)
   إلى حساب: رأس المال (دائن 1000)
   البيان: قيد افتتاحي
   ```
4. **احفظ واتحقق من ظهور القيد في القائمة**

---

## ✅ تم تأكيد الإعداد - July 5, 2025

**حالة المشروع:** جاهز لربط قاعدة البيانات  
**Supabase Project:** yieyqusnciiithjtlgod  
**API Keys:** متوفرة ومحدثة  

### الخطوات المتبقية:
1. إضافة Environment Variables في Netlify
2. تشغيل SQL Schema في Supabase  
3. إعادة نشر الموقع
4. اختبار الاتصال عبر `/api/db-status`

---

**⏱️ الوقت المطلوب:** 5-10 دقائق  
**💰 التكلفة:** مجانية (Free Tier)  
**🚀 الحالة:** جاهز للإنتاج
