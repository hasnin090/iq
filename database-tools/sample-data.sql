-- ===================================
-- بيانات تجريبية للنظام المحاسبي
-- تنفيذ هذا بعد إنشاء الجداول الأساسية
-- ===================================

-- إدراج فئات إضافية
INSERT INTO categories (name, name_ar, type, description, color) VALUES 
('Office Expenses', 'مصاريف المكتب', 'expense', 'Office supplies and equipment', '#FF5722'),
('Travel Expenses', 'مصاريف السفر', 'expense', 'Travel and transportation costs', '#9C27B0'),
('Utilities', 'المرافق العامة', 'expense', 'Electricity, water, internet', '#2196F3'),
('Equipment', 'المعدات', 'asset', 'Office equipment and machinery', '#4CAF50'),
('Inventory', 'المخزون', 'asset', 'Stock and inventory items', '#FF9800'),
('Service Revenue', 'إيرادات الخدمات', 'income', 'Revenue from services', '#8BC34A'),
('Product Sales', 'مبيعات المنتجات', 'income', 'Revenue from product sales', '#CDDC39')
ON CONFLICT DO NOTHING;

-- إدراج حسابات تفصيلية
INSERT INTO accounts (account_number, name, name_ar, type, balance, currency) VALUES 
('1010', 'Petty Cash', 'النقدية الصغيرة', 'asset', 5000.00, 'IQD'),
('1110', 'Bank - Main Account', 'البنك - الحساب الرئيسي', 'asset', 100000.00, 'IQD'),
('1120', 'Bank - USD Account', 'البنك - حساب الدولار', 'asset', 2500.00, 'USD'),
('1200', 'Accounts Receivable', 'الحسابات المدينة', 'asset', 25000.00, 'IQD'),
('1300', 'Office Equipment', 'معدات المكتب', 'asset', 15000.00, 'IQD'),
('2100', 'Accounts Payable', 'الحسابات الدائنة', 'liability', -8000.00, 'IQD'),
('2200', 'Accrued Expenses', 'المصروفات المستحقة', 'liability', -3000.00, 'IQD'),
('4100', 'Consulting Revenue', 'إيرادات الاستشارات', 'income', 0.00, 'IQD'),
('4200', 'Training Revenue', 'إيرادات التدريب', 'income', 0.00, 'IQD'),
('5100', 'Rent Expense', 'مصاريف الإيجار', 'expense', 0.00, 'IQD'),
('5200', 'Salary Expense', 'مصاريف الرواتب', 'expense', 0.00, 'IQD'),
('5300', 'Internet & Phone', 'الإنترنت والهاتف', 'expense', 0.00, 'IQD')
ON CONFLICT (account_number) DO NOTHING;

-- إدراج جهات اتصال تجريبية
INSERT INTO contacts (type, name, company, email, phone, address, city, country) VALUES 
('client', 'أحمد محمد علي', 'شركة الرافدين للتجارة', 'ahmed@rafidain.com', '+964-771-123-4567', 'شارع الكرادة، بناية 15', 'بغداد', 'العراق'),
('client', 'فاطمة حسن', 'مؤسسة النور للخدمات', 'fatima@alnoor.com', '+964-750-987-6543', 'حي المنصور، شارع 14 رمضان', 'بغداد', 'العراق'),
('supplier', 'شركة التقنية المتقدمة', NULL, 'info@advtech.iq', '+964-790-555-0123', 'منطقة الجادرية', 'بغداد', 'العراق'),
('supplier', 'مكتب الخليج للقرطاسية', NULL, 'gulf@stationery.com', '+964-771-444-5555', 'سوق الشورجة', 'بغداد', 'العراق'),
('employee', 'سارة أحمد الجبوري', NULL, 'sara.ahmed@company.iq', '+964-780-111-2222', 'حي الحرية', 'بغداد', 'العراق')
ON CONFLICT DO NOTHING;

-- إدراج مشاريع تجريبية
INSERT INTO projects (name, description, status, start_date, budget, currency) VALUES 
('تطوير موقع إلكتروني', 'تطوير موقع إلكتروني للشركة مع نظام إدارة المحتوى', 'active', '2025-01-01', 15000.00, 'IQD'),
('نظام المحاسبة', 'تطوير وتنفيذ نظام محاسبة متكامل', 'active', '2025-01-15', 25000.00, 'IQD'),
('تدريب الموظفين', 'برنامج تدريبي شامل للموظفين الجدد', 'planning', '2025-02-01', 8000.00, 'IQD')
ON CONFLICT DO NOTHING;

-- إدراج فواتير تجريبية
INSERT INTO invoices (invoice_number, type, status, client_name, client_email, subtotal, tax_amount, total_amount, issue_date, due_date, notes) VALUES 
('INV-2025-001', 'sales', 'sent', 'أحمد محمد علي', 'ahmed@rafidain.com', 10000.00, 1000.00, 11000.00, '2025-01-10', '2025-02-10', 'فاتورة خدمات استشارية'),
('INV-2025-002', 'sales', 'draft', 'فاطمة حسن', 'fatima@alnoor.com', 7500.00, 750.00, 8250.00, '2025-01-15', '2025-02-15', 'فاتورة تدريب موظفين'),
('INV-2025-003', 'purchase', 'paid', 'شركة التقنية المتقدمة', 'info@advtech.iq', 3000.00, 300.00, 3300.00, '2025-01-12', '2025-02-12', 'شراء معدات مكتبية')
ON CONFLICT (invoice_number) DO NOTHING;

-- إدراج بنود الفواتير
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price, tax_rate) 
SELECT 
    i.id,
    CASE 
        WHEN i.invoice_number = 'INV-2025-001' THEN 'استشارات تطوير الأعمال'
        WHEN i.invoice_number = 'INV-2025-002' THEN 'دورة تدريبية - إدارة المشاريع'
        WHEN i.invoice_number = 'INV-2025-003' THEN 'جهاز كمبيوتر محمول'
    END,
    CASE 
        WHEN i.invoice_number = 'INV-2025-001' THEN 20.0
        WHEN i.invoice_number = 'INV-2025-002' THEN 5.0
        WHEN i.invoice_number = 'INV-2025-003' THEN 1.0
    END,
    CASE 
        WHEN i.invoice_number = 'INV-2025-001' THEN 500.00
        WHEN i.invoice_number = 'INV-2025-002' THEN 1500.00
        WHEN i.invoice_number = 'INV-2025-003' THEN 3000.00
    END,
    CASE 
        WHEN i.invoice_number = 'INV-2025-001' THEN 10000.00
        WHEN i.invoice_number = 'INV-2025-002' THEN 7500.00
        WHEN i.invoice_number = 'INV-2025-003' THEN 3000.00
    END,
    10.0
FROM invoices i
WHERE i.invoice_number IN ('INV-2025-001', 'INV-2025-002', 'INV-2025-003')
ON CONFLICT DO NOTHING;

-- إدراج مدفوعات تجريبية
INSERT INTO payments (payment_number, type, method, amount, description, payment_date, reference_number, status) VALUES 
('PAY-2025-001', 'received', 'bank_transfer', 5500.00, 'دفعة مقدمة من أحمد محمد علي', '2025-01-12', 'TXN-789456123', 'completed'),
('PAY-2025-002', 'paid', 'cash', 3300.00, 'دفع فاتورة معدات مكتبية', '2025-01-13', NULL, 'completed'),
('PAY-2025-003', 'received', 'cheque', 8250.00, 'دفع كامل من مؤسسة النور', '2025-01-18', 'CHQ-001122', 'completed')
ON CONFLICT (payment_number) DO NOTHING;

-- إدراج معاملات محاسبية تجريبية
INSERT INTO transactions (type, amount, description, transaction_date, reference_number, status) VALUES 
('income', 5500.00, 'استلام دفعة مقدمة من العميل', '2025-01-12', 'TXN-001', 'posted'),
('expense', 3300.00, 'شراء معدات مكتبية', '2025-01-13', 'TXN-002', 'posted'),
('income', 8250.00, 'استلام دفع كامل للفاتورة', '2025-01-18', 'TXN-003', 'posted'),
('expense', 2500.00, 'دفع إيجار المكتب لشهر يناير', '2025-01-20', 'TXN-004', 'posted'),
('expense', 1800.00, 'رواتب الموظفين', '2025-01-25', 'TXN-005', 'posted')
ON CONFLICT DO NOTHING;

-- إدراج إعدادات النظام
INSERT INTO settings (key, value, description, type) VALUES 
('company_name', 'شركة الأنظمة المتقدمة المحدودة', 'اسم الشركة', 'text'),
('company_address', 'بغداد، العراق، شارع الكرادة، بناية رقم 123', 'عنوان الشركة', 'text'),
('company_phone', '+964-770-123-4567', 'هاتف الشركة', 'text'),
('company_email', 'info@advanced-systems.iq', 'بريد الشركة الإلكتروني', 'text'),
('tax_rate', '10', 'معدل الضريبة الافتراضي (%)', 'number'),
('currency_primary', 'IQD', 'العملة الأساسية', 'text'),
('currency_secondary', 'USD', 'العملة الثانوية', 'text'),
('exchange_rate_usd', '1320', 'سعر صرف الدولار مقابل الدينار', 'number'),
('invoice_prefix', 'INV', 'بادئة رقم الفاتورة', 'text'),
('payment_prefix', 'PAY', 'بادئة رقم الدفع', 'text'),
('fiscal_year_start', '01-01', 'بداية السنة المالية (شهر-يوم)', 'text'),
('backup_frequency', '7', 'تكرار النسخ الاحتياطي (أيام)', 'number')
ON CONFLICT (key) DO NOTHING;

-- انتهى إدراج البيانات التجريبية
