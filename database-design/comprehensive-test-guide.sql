-- 🔍 دليل فحص شامل لجميع عمليات النظام
-- ===============================================

-- ✅ 1. فحص تسجيل الدخول وإدارة المستخدمين
-- ============================================

-- فحص إنشاء ملف شخصي جديد (يتم تلقائياً عند التسجيل في Supabase)
INSERT INTO profiles (id, full_name, role) VALUES 
('test-user-id', 'محمد أحمد المختبر', 'user');

-- فحص عرض الملف الشخصي
SELECT * FROM profiles WHERE id = 'test-user-id';

-- فحص تحديث الصلاحيات
UPDATE profiles SET role = 'manager' WHERE id = 'test-user-id';

-- ✅ 2. فحص إدارة المشاريع
-- =========================

-- فحص إضافة مشروع جديد
INSERT INTO projects (name, description, budget, start_date, created_by) VALUES
('مشروع اختبار', 'مشروع للاختبار والتجريب', 100000.00, CURRENT_DATE, 'test-user-id');

-- فحص عرض المشاريع
SELECT * FROM project_summary WHERE created_by = 'test-user-id';

-- فحص تحديث بيانات المشروع
UPDATE projects SET budget = 150000.00 WHERE name = 'مشروع اختبار';

-- ✅ 3. فحص ربط المستخدمين بالمشاريع
-- ===================================

-- فحص إضافة دور مستخدم في مشروع
INSERT INTO user_roles (user_id, project_id, role) 
SELECT 'test-user-id', id, 'owner' FROM projects WHERE name = 'مشروع اختبار';

-- فحص عرض أدوار المستخدمين
SELECT 
    p.name as project_name,
    pr.full_name,
    ur.role,
    ur.created_at
FROM user_roles ur
JOIN projects p ON p.id = ur.project_id
JOIN profiles pr ON pr.id = ur.user_id;

-- فحص تغيير الصلاحيات
UPDATE user_roles SET role = 'manager' 
WHERE user_id = 'test-user-id' AND project_id IN (
    SELECT id FROM projects WHERE name = 'مشروع اختبار'
);

-- ✅ 4. فحص إدارة الموظفين
-- ========================

-- فحص إضافة موظف جديد
INSERT INTO employees (name, salary, assigned_project_id, created_by)
SELECT 'أحمد محمد العامل', 3000.00, id, 'test-user-id' 
FROM projects WHERE name = 'مشروع اختبار';

-- فحص عرض الموظفين
SELECT 
    e.name,
    e.salary,
    p.name as project_name,
    e.active,
    e.hire_date
FROM employees e
LEFT JOIN projects p ON p.id = e.assigned_project_id
WHERE e.created_by = 'test-user-id';

-- فحص تحديث بيانات موظف
UPDATE employees SET salary = 3500.00 
WHERE name = 'أحمد محمد العامل' AND created_by = 'test-user-id';

-- ✅ 5. فحص المعاملات المالية
-- ===========================

-- فحص إضافة معاملة دخل
INSERT INTO transactions (type, amount, description, date, project_id, created_by)
SELECT 'income', 50000.00, 'دفعة مقدمة من العميل', CURRENT_DATE, id, 'test-user-id'
FROM projects WHERE name = 'مشروع اختبار';

-- فحص إضافة معاملة مصروف
INSERT INTO transactions (type, amount, description, date, project_id, expense_type_id, created_by)
SELECT 
    'expense', 
    5000.00, 
    'شراء مواد أسمنت', 
    CURRENT_DATE, 
    p.id, 
    et.id,
    'test-user-id'
FROM projects p, expense_types et 
WHERE p.name = 'مشروع اختبار' AND et.name = 'مواد البناء';

-- فحص عرض المعاملات مع التفاصيل
SELECT * FROM transaction_details WHERE created_by = 'test-user-id';

-- فحص تحديث المبلغ المنفق في المشروع (تلقائي)
SELECT name, budget, spent, remaining FROM project_summary 
WHERE name = 'مشروع اختبار';

-- ✅ 6. فحص إدارة الوثائق
-- =======================

-- فحص إضافة وثيقة
INSERT INTO documents (title, description, file_url, file_type, created_by) VALUES
('فاتورة مواد البناء', 'فاتورة شراء الاسمنت والحديد', '/uploads/invoice-001.pdf', 'application/pdf', 'test-user-id');

-- فحص ربط وثيقة بمعاملة
INSERT INTO document_links (document_id, entity_type, entity_uuid, linked_by)
SELECT 
    d.id,
    'transaction',
    t.id,
    'test-user-id'
FROM documents d, transactions t
WHERE d.title = 'فاتورة مواد البناء' 
AND t.description = 'شراء مواد أسمنت'
AND t.created_by = 'test-user-id';

-- فحص عرض الوثائق المرتبطة
SELECT 
    d.title,
    d.file_url,
    dl.entity_type,
    t.description as linked_transaction
FROM documents d
JOIN document_links dl ON dl.document_id = d.id
LEFT JOIN transactions t ON t.id = dl.entity_uuid
WHERE d.created_by = 'test-user-id';

-- ✅ 7. فحص المستحقات والدفعات
-- =============================

-- فحص إضافة مستحق جديد
INSERT INTO receivables (beneficiary_name, amount, description, due_date, created_by) VALUES
('شركة المقاولات المتحدة', 25000.00, 'مستحق أعمال الحفر', CURRENT_DATE + INTERVAL '30 days', 'test-user-id');

-- فحص إضافة دفعة للمستحق
INSERT INTO receivable_payments (receivable_id, amount, payment_date, notes, created_by)
SELECT id, 10000.00, CURRENT_DATE, 'دفعة جزئية أولى', 'test-user-id'
FROM receivables WHERE beneficiary_name = 'شركة المقاولات المتحدة';

-- فحص عرض المستحقات مع التفاصيل
SELECT * FROM receivable_summary WHERE created_by = 'test-user-id';

-- ✅ 8. فحص دفتر الأستاذ والقيود المحاسبية
-- ==========================================

-- فحص إضافة قيد محاسبي
INSERT INTO ledger_entries (account_name, debit_amount, credit_amount, description, entry_date, created_by)
VALUES 
('حساب المواد الخام', 5000.00, 0, 'شراء مواد البناء', CURRENT_DATE, 'test-user-id'),
('حساب الصندوق', 0, 5000.00, 'دفع نقدي للمواد', CURRENT_DATE, 'test-user-id');

-- فحص عرض دفتر الأستاذ
SELECT 
    account_name,
    debit_amount,
    credit_amount,
    description,
    entry_date
FROM ledger_entries 
WHERE created_by = 'test-user-id'
ORDER BY entry_date DESC, id;

-- ✅ 9. فحص سجل الأنشطة
-- ====================

-- فحص إضافة نشاط للسجل
INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES
('test-user-id', 'CREATE_PROJECT', 'project', (SELECT id FROM projects WHERE name = 'مشروع اختبار'), 
 '{"project_name": "مشروع اختبار", "budget": 150000}');

-- فحص عرض سجل الأنشطة
SELECT 
    action,
    entity_type,
    details,
    created_at
FROM activity_logs 
WHERE user_id = 'test-user-id'
ORDER BY created_at DESC;

-- ✅ 10. فحص الأداء والفهارس
-- ===========================

-- فحص استخدام الفهارس (تحليل خطة الاستعلام)
EXPLAIN ANALYZE SELECT * FROM transactions WHERE project_id = (SELECT id FROM projects WHERE name = 'مشروع اختبار');

EXPLAIN ANALYZE SELECT * FROM user_roles WHERE user_id = 'test-user-id';

-- ✅ 11. فحص صلاحيات الوصول (RLS)
-- =================================

-- تجربة الوصول بمستخدم مختلف (يجب أن تفشل)
SET LOCAL "request.jwt.claims" TO '{"sub": "other-user-id"}';

-- هذا الاستعلام يجب أن يعيد فقط البيانات التي ينتمي إليها المستخدم الحالي
SELECT COUNT(*) as my_projects FROM projects;
SELECT COUNT(*) as my_transactions FROM transactions;

-- إعادة تعيين السياق
RESET ALL;

-- ✅ 12. تقرير شامل للنظام
-- =========================

SELECT 
    'projects' as table_name,
    COUNT(*) as record_count
FROM projects
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'receivables', COUNT(*) FROM receivables
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles;

-- تنظيف بيانات الاختبار (اختياري)
/*
DELETE FROM receivable_payments WHERE created_by = 'test-user-id';
DELETE FROM receivables WHERE created_by = 'test-user-id';
DELETE FROM ledger_entries WHERE created_by = 'test-user-id';
DELETE FROM activity_logs WHERE user_id = 'test-user-id';
DELETE FROM document_links WHERE linked_by = 'test-user-id';
DELETE FROM documents WHERE created_by = 'test-user-id';
DELETE FROM transactions WHERE created_by = 'test-user-id';
DELETE FROM employees WHERE created_by = 'test-user-id';
DELETE FROM user_roles WHERE user_id = 'test-user-id';
DELETE FROM projects WHERE created_by = 'test-user-id';
DELETE FROM profiles WHERE id = 'test-user-id';
*/
