# 🗄️ دليل إعداد قاعدة بيانات Supabase - نظام المحاسبة العربي

## خطوات إنشاء قاعدة البيانات

### الخطوة 1: إنشاء مشروع Supabase جديد

1. **اذهب إلى [supabase.com](https://supabase.com)**
2. **اضغط "Start your project"**
3. **سجل دخول بـ GitHub**
4. **اضغط "New Project"**
5. **املأ البيانات:**
   ```
   Name: نظام المحاسبة العربي
   Database Password: [اختر كلمة مرور قوية]
   Region: Singapore (أو الأقرب لك)
   Pricing Plan: Free tier
   ```
6. **اضغط "Create new project"**
7. **انتظر حتى ينتهي الإعداد (2-3 دقائق)**

### الخطوة 2: الحصول على معلومات الاتصال

بعد إنشاء المشروع:

1. **اذهب إلى Settings > API**
2. **انسخ هذه المعلومات:**
   ```
   Project URL: https://[project-id].supabase.co
   anon public key: eyJ0eXAiOi... [المفتاح الطويل]
   service_role key: eyJ0eXAiOi... [المفتاح السري]
   ```

### الخطوة 3: تشغيل السكيما

1. **اذهب إلى SQL Editor في Supabase Dashboard**
2. **انسخ والصق الكود التالي:**

```sql
-- إنشاء جداول نظام المحاسبة العربي

-- جدول الحسابات
CREATE TABLE accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('أصول', 'خصوم', 'حقوق الملكية', 'إيرادات', 'مصروفات')),
    parent_id UUID REFERENCES accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الفترات المحاسبية
CREATE TABLE fiscal_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول أنواع المستندات
CREATE TABLE document_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    prefix VARCHAR(10),
    is_active BOOLEAN DEFAULT true
);

-- جدول المستندات
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_number VARCHAR(100) NOT NULL,
    document_type_id UUID REFERENCES document_types(id),
    date DATE NOT NULL,
    description TEXT,
    reference VARCHAR(255),
    total_debit DECIMAL(15,2) DEFAULT 0,
    total_credit DECIMAL(15,2) DEFAULT 0,
    is_posted BOOLEAN DEFAULT false,
    fiscal_period_id UUID REFERENCES fiscal_periods(id),
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول تفاصيل المستندات (القيود)
CREATE TABLE document_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    description TEXT,
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    sequence_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المرفقات
CREATE TABLE attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المستخدمين
CREATE TABLE app_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج بيانات تجريبية

-- الحسابات الأساسية
INSERT INTO accounts (name, code, type) VALUES
('الأصول', '1', 'أصول'),
('الأصول المتداولة', '11', 'أصول'),
('النقد في الصندوق', '1101', 'أصول'),
('البنك', '1102', 'أصول'),
('العملاء', '1201', 'أصول'),
('المخزون', '1301', 'أصول'),

('الخصوم', '2', 'خصوم'),
('الخصوم المتداولة', '21', 'خصوم'),
('الموردين', '2101', 'خصوم'),
('أوراق الدفع', '2102', 'خصوم'),

('حقوق الملكية', '3', 'حقوق الملكية'),
('رأس المال', '3101', 'حقوق الملكية'),
('الأرباح المحتجزة', '3201', 'حقوق الملكية'),

('الإيرادات', '4', 'إيرادات'),
('إيرادات المبيعات', '4101', 'إيرادات'),
('إيرادات أخرى', '4901', 'إيرادات'),

('المصروفات', '5', 'مصروفات'),
('تكلفة البضاعة المباعة', '5101', 'مصروفات'),
('مصروفات البيع والتوزيع', '5201', 'مصروفات'),
('المصروفات الإدارية', '5301', 'مصروفات');

-- فترة محاسبية تجريبية
INSERT INTO fiscal_periods (name, start_date, end_date) VALUES
('السنة المالية 2025', '2025-01-01', '2025-12-31');

-- أنواع المستندات
INSERT INTO document_types (name, code, prefix) VALUES
('قيد يومية', 'JE', 'ق.ي'),
('سند قبض', 'RV', 'س.ق'),
('سند صرف', 'PV', 'س.ص'),
('فاتورة مبيعات', 'SI', 'ف.م'),
('فاتورة مشتريات', 'PI', 'ف.ش');

-- مستخدم تجريبي
INSERT INTO app_users (username, email, full_name, role) VALUES
('admin', 'admin@accounting.com', 'مدير النظام', 'admin');

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX idx_accounts_code ON accounts(code);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_documents_date ON documents(date);
CREATE INDEX idx_documents_number ON documents(document_number);
CREATE INDEX idx_document_entries_account ON document_entries(account_id);
CREATE INDEX idx_document_entries_document ON document_entries(document_id);

-- تفعيل Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان (مؤقتاً مفتوحة للجميع)
CREATE POLICY "Allow all operations" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON document_entries FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON fiscal_periods FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON document_types FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON attachments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON app_users FOR ALL USING (true);
```

3. **اضغط "Run" لتنفيذ السكيما**

### الخطوة 4: تحديث إعدادات Netlify

1. **اذهب إلى Netlify Dashboard**
2. **اختر موقعك > Site settings > Environment variables**
3. **أضف المتغيرات التالية:**

```bash
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key-من-supabase]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key-من-supabase]
```

4. **اضغط "Save"**
5. **اذهب إلى Deploys وانشر الموقع مرة أخرى:**
   - اضغط "Trigger deploy"
   - اختر "Deploy site"

## 🔧 اختبار الاتصال

بعد إعادة النشر:

1. **اذهب إلى موقعك على Netlify**
2. **سجل دخول بـ admin/admin**
3. **جرب إنشاء قيد محاسبي جديد**
4. **تحقق من أن البيانات تُحفظ في Supabase**

## 🎯 ملاحظات مهمة

- **استخدم HTTPS دائماً** مع Supabase
- **احتفظ بـ service_role_key سرياً** (لا تشاركه)
- **المفتاح anon_key آمن للاستخدام في Frontend**
- **يمكن مراقبة قاعدة البيانات من Supabase Dashboard**

## 🔍 استكشاف المشاكل

إذا لم يعمل الاتصال:

1. **تحقق من Environment Variables في Netlify**
2. **تحقق من أن Supabase project نشط**
3. **تحقق من Build logs في Netlify**
4. **اختبر API calls من Browser Console**

---

بعد هذه الخطوات، ستكون قاعدة البيانات متصلة ونظام المحاسبة سيعمل بكامل وظائفه! 🎉
