-- 🔒 دليل فحص الصلاحيات والأمان (RLS)
-- ========================================

-- ✅ 1. فحص صلاحيات الملفات الشخصية
-- ==================================

-- المستخدم يجب أن يرى ملفه الشخصي فقط
SELECT 'Can see own profile' as test_name, COUNT(*) as result 
FROM profiles WHERE auth.uid() = id;

-- المستخدم لا يجب أن يرى ملفات المستخدمين الآخرين
SELECT 'Cannot see other profiles' as test_name, COUNT(*) as result 
FROM profiles WHERE auth.uid() != id;

-- ✅ 2. فحص صلاحيات المشاريع
-- ===========================

-- المستخدم يرى فقط المشاريع التي له دور فيها
SELECT 'Can see assigned projects' as test_name, COUNT(*) as result
FROM projects p
WHERE EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.project_id = p.id
) OR p.created_by = auth.uid();

-- فحص إدراج مشروع جديد (يجب أن ينجح للمستخدم المخول)
INSERT INTO projects (name, description, budget, created_by) 
VALUES ('مشروع اختبار الصلاحيات', 'اختبار إدراج مشروع', 50000.00, auth.uid())
RETURNING id, name, 'Project created successfully' as status;

-- ✅ 3. فحص صلاحيات أدوار المستخدمين
-- ===================================

-- المالك يستطيع إضافة مستخدمين للمشروع
INSERT INTO user_roles (user_id, project_id, role)
SELECT 
    'new-user-id',
    p.id,
    'viewer'
FROM projects p 
WHERE p.name = 'مشروع اختبار الصلاحيات'
AND (
    p.created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.project_id = p.id 
        AND ur.role = 'owner'
    )
)
RETURNING user_id, role, 'Role assigned successfully' as status;

-- ✅ 4. فحص صلاحيات الموظفين
-- ===========================

-- المدير يستطيع إضافة موظف للمشروع
INSERT INTO employees (name, salary, assigned_project_id, created_by)
SELECT 
    'موظف اختبار الصلاحيات',
    2500.00,
    p.id,
    auth.uid()
FROM projects p
WHERE p.name = 'مشروع اختبار الصلاحيات'
AND (
    p.created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.project_id = p.id 
        AND ur.role IN ('owner', 'manager')
    )
)
RETURNING name, salary, 'Employee added successfully' as status;

-- المستخدم يرى فقط الموظفين في مشاريعه
SELECT 'Can see project employees' as test_name, COUNT(*) as result
FROM employees e
WHERE e.created_by = auth.uid() OR
EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.project_id = e.assigned_project_id
);

-- ✅ 5. فحص صلاحيات المعاملات المالية
-- ===================================

-- المستخدم يستطيع إضافة معاملة لمشروعه
INSERT INTO transactions (type, amount, description, date, project_id, created_by)
SELECT 
    'expense',
    1000.00,
    'معاملة اختبار الصلاحيات',
    CURRENT_DATE,
    p.id,
    auth.uid()
FROM projects p
WHERE p.name = 'مشروع اختبار الصلاحيات'
AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.project_id = p.id
    AND ur.role IN ('owner', 'manager')
)
RETURNING amount, description, 'Transaction created successfully' as status;

-- المستخدم يرى فقط معاملاته
SELECT 'Can see own transactions' as test_name, COUNT(*) as result
FROM transactions t
WHERE t.created_by = auth.uid() OR
EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN projects p ON p.id = ur.project_id 
    WHERE ur.user_id = auth.uid() AND p.id = t.project_id
);

-- ✅ 6. فحص صلاحيات الوثائق
-- ==========================

-- المستخدم يستطيع إضافة وثيقة
INSERT INTO documents (title, description, file_url, created_by)
VALUES ('وثيقة اختبار الصلاحيات', 'اختبار إضافة وثيقة', '/test-doc.pdf', auth.uid())
RETURNING title, 'Document created successfully' as status;

-- المستخدم يرى فقط وثائقه
SELECT 'Can see own documents' as test_name, COUNT(*) as result
FROM documents WHERE created_by = auth.uid();

-- ✅ 7. فحص صلاحيات المستحقات
-- =============================

-- المستخدم يستطيع إضافة مستحق
INSERT INTO receivables (beneficiary_name, amount, description, created_by)
VALUES ('جهة اختبار الصلاحيات', 5000.00, 'مستحق اختبار', auth.uid())
RETURNING beneficiary_name, amount, 'Receivable created successfully' as status;

-- المستخدم يستطيع إضافة دفعة للمستحق
INSERT INTO receivable_payments (receivable_id, amount, payment_date, created_by)
SELECT r.id, 2000.00, CURRENT_DATE, auth.uid()
FROM receivables r 
WHERE r.beneficiary_name = 'جهة اختبار الصلاحيات' AND r.created_by = auth.uid()
RETURNING amount, 'Payment recorded successfully' as status;

-- ✅ 8. فحص صلاحيات دفتر الأستاذ
-- ===============================

-- المستخدم يستطيع إضافة قيد محاسبي
INSERT INTO ledger_entries (account_name, debit_amount, description, entry_date, created_by)
VALUES ('حساب اختبار الصلاحيات', 1000.00, 'قيد اختبار', CURRENT_DATE, auth.uid())
RETURNING account_name, debit_amount, 'Ledger entry created successfully' as status;

-- المستخدم يرى فقط قيوده
SELECT 'Can see own ledger entries' as test_name, COUNT(*) as result
FROM ledger_entries WHERE created_by = auth.uid();

-- ✅ 9. فحص صلاحيات سجل الأنشطة
-- ===============================

-- المستخدم يستطيع إضافة نشاط
INSERT INTO activity_logs (user_id, action, entity_type, details)
VALUES (auth.uid(), 'TEST_PERMISSION', 'test', '{"test": "permission check"}')
RETURNING action, 'Activity logged successfully' as status;

-- المستخدم يرى فقط أنشطته
SELECT 'Can see own activities' as test_name, COUNT(*) as result
FROM activity_logs WHERE user_id = auth.uid();

-- ✅ 10. فحص صلاحيات التحديث والحذف
-- ===================================

-- فحص تحديث مشروع (يجب أن ينجح للمالك/المدير)
UPDATE projects SET description = 'وصف محدث للاختبار'
WHERE name = 'مشروع اختبار الصلاحيات'
AND (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.project_id = projects.id 
        AND ur.role IN ('owner', 'manager')
    )
)
RETURNING name, 'Project updated successfully' as status;

-- فحص تحديث معاملة (يجب أن ينجح للمنشئ)
UPDATE transactions SET description = 'معاملة محدثة للاختبار'
WHERE description = 'معاملة اختبار الصلاحيات' 
AND created_by = auth.uid()
RETURNING description, 'Transaction updated successfully' as status;

-- فحص تحديث وثيقة (يجب أن ينجح للمنشئ)
UPDATE documents SET description = 'وثيقة محدثة للاختبار'
WHERE title = 'وثيقة اختبار الصلاحيات' 
AND created_by = auth.uid()
RETURNING title, 'Document updated successfully' as status;

-- ✅ 11. فحص صلاحيات حسب الدور
-- =============================

-- فحص أن المشاهد (viewer) لا يستطيع إضافة معاملات
SELECT 
    ur.role,
    CASE 
        WHEN ur.role IN ('owner', 'manager') THEN 'Can add transactions'
        ELSE 'Cannot add transactions'
    END as permission_status
FROM user_roles ur
WHERE ur.user_id = auth.uid();

-- ✅ 12. ملخص فحص الصلاحيات
-- ===========================

SELECT 
    'PERMISSION_TEST_SUMMARY' as test_type,
    COUNT(CASE WHEN table_name = 'projects' THEN 1 END) as projects_accessible,
    COUNT(CASE WHEN table_name = 'transactions' THEN 1 END) as transactions_accessible,
    COUNT(CASE WHEN table_name = 'employees' THEN 1 END) as employees_accessible,
    COUNT(CASE WHEN table_name = 'documents' THEN 1 END) as documents_accessible,
    COUNT(CASE WHEN table_name = 'receivables' THEN 1 END) as receivables_accessible
FROM (
    SELECT 'projects' as table_name FROM projects 
    WHERE created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND project_id = projects.id
    )
    UNION ALL
    SELECT 'transactions' FROM transactions WHERE created_by = auth.uid()
    UNION ALL  
    SELECT 'employees' FROM employees WHERE created_by = auth.uid()
    UNION ALL
    SELECT 'documents' FROM documents WHERE created_by = auth.uid()
    UNION ALL
    SELECT 'receivables' FROM receivables WHERE created_by = auth.uid()
) accessible_tables;
