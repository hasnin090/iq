-- ===================================
-- SQL لإنشاء جداول النظام المحاسبي
-- تنفيذ هذا الكود في Supabase SQL Editor
-- ===================================

-- 1. جدول الفئات/التصنيفات
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense', 'asset', 'liability')),
    parent_id UUID REFERENCES categories(id),
    color VARCHAR(7) DEFAULT '#000000',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- 2. جدول الحسابات
CREATE TABLE IF NOT EXISTS accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
    category_id UUID REFERENCES categories(id),
    parent_account_id UUID REFERENCES accounts(id),
    balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'IQD',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- 3. جدول جهات الاتصال
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('client', 'supplier', 'employee', 'other')),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'العراق',
    tax_number VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- 4. جدول الفواتير
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('sales', 'purchase', 'service')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled', 'overdue')),
    contact_id UUID REFERENCES contacts(id),
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    client_address TEXT,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'IQD',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    payment_terms TEXT,
    notes TEXT,
    project_id UUID REFERENCES projects(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- 5. جدول بنود الفواتير
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. جدول المدفوعات
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('received', 'paid')),
    method VARCHAR(30) DEFAULT 'cash' CHECK (method IN ('cash', 'bank_transfer', 'cheque', 'card', 'online')),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IQD',
    reference_number VARCHAR(100),
    description TEXT,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    account_id UUID REFERENCES accounts(id),
    invoice_id UUID REFERENCES invoices(id),
    project_id UUID REFERENCES projects(id),
    contact_id UUID REFERENCES contacts(id),
    recipient_name VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- 7. تحديث جدول المعاملات
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS account_debit_id UUID REFERENCES accounts(id),
ADD COLUMN IF NOT EXISTS account_credit_id UUID REFERENCES accounts(id),
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id),
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id),
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id),
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id),
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'IQD',
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'cancelled'));

-- 8. إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);

-- 9. إنشاء triggers لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق triggers على الجداول
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. إدراج بيانات أساسية للحسابات
INSERT INTO categories (name, name_ar, type) VALUES 
('Assets', 'الأصول', 'asset'),
('Liabilities', 'الخصوم', 'liability'),
('Income', 'الإيرادات', 'income'),
('Expenses', 'المصروفات', 'expense')
ON CONFLICT DO NOTHING;

-- 11. إدراج حسابات أساسية
INSERT INTO accounts (account_number, name, name_ar, type) VALUES 
('1000', 'Cash', 'النقدية', 'asset'),
('1100', 'Bank Account', 'الحساب المصرفي', 'asset'),
('2000', 'Accounts Payable', 'الحسابات الدائنة', 'liability'),
('3000', 'Capital', 'رأس المال', 'equity'),
('4000', 'Sales Revenue', 'إيرادات المبيعات', 'income'),
('5000', 'Operating Expenses', 'المصروفات التشغيلية', 'expense')
ON CONFLICT (account_number) DO NOTHING;

-- 12. تفعيل Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 13. إنشاء سياسات RLS أساسية (يمكن للمستخدمين المسجلين الوصول)
CREATE POLICY "Users can view categories" ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert categories" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update categories" ON categories FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view accounts" ON accounts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert accounts" ON accounts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update accounts" ON accounts FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view contacts" ON contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert contacts" ON contacts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update contacts" ON contacts FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view invoices" ON invoices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert invoices" ON invoices FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update invoices" ON invoices FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view invoice_items" ON invoice_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert invoice_items" ON invoice_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update invoice_items" ON invoice_items FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view payments" ON payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert payments" ON payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update payments" ON payments FOR UPDATE USING (auth.role() = 'authenticated');

-- انتهى تجهيز قاعدة البيانات
