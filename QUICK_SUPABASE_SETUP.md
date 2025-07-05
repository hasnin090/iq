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

### 3. تشغيل Database Schema
```sql
-- انسخ والصق في SQL Editor:

CREATE TABLE accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_number VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    total_debit DECIMAL(15,2) DEFAULT 0,
    total_credit DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE document_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id),
    account_id UUID REFERENCES accounts(id),
    description TEXT,
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0
);

-- بيانات تجريبية
INSERT INTO accounts (name, code, type) VALUES
('النقد في الصندوق', '1101', 'أصول'),
('البنك', '1102', 'أصول'),
('العملاء', '1201', 'أصول'),
('الموردين', '2101', 'خصوم'),
('رأس المال', '3101', 'حقوق الملكية'),
('إيرادات المبيعات', '4101', 'إيرادات'),
('مصروفات البيع', '5201', 'مصروفات');

-- تفعيل الوصول العام (للتجربة)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow all" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all" ON document_entries FOR ALL USING (true);
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
