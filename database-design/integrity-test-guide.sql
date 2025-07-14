-- 🔧 دليل فحص التكامل وسلامة البيانات
-- ====================================

-- ✅ 1. فحص القيود والمفاتيح الخارجية
-- ===================================

-- فحص القيود الموجودة في النظام
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN (
    'projects', 'transactions', 'employees', 'documents', 
    'receivables', 'receivable_payments', 'ledger_entries',
    'activity_logs', 'salaries', 'user_roles', 'profiles'
)
ORDER BY tc.table_name, tc.constraint_type;

-- فحص سلامة المفاتيح الخارجية
SELECT 
    'Foreign Key Integrity Check' as test_name,
    'projects -> user_roles' as relationship,
    COUNT(*) as orphaned_records
FROM user_roles ur
LEFT JOIN projects p ON p.id = ur.project_id
WHERE p.id IS NULL;

SELECT 
    'Foreign Key Integrity Check' as test_name,
    'projects -> transactions' as relationship,
    COUNT(*) as orphaned_records
FROM transactions t
LEFT JOIN projects p ON p.id = t.project_id
WHERE p.id IS NULL;

SELECT 
    'Foreign Key Integrity Check' as test_name,
    'projects -> employees' as relationship,
    COUNT(*) as orphaned_records
FROM employees e
LEFT JOIN projects p ON p.id = e.assigned_project_id
WHERE p.id IS NULL;

SELECT 
    'Foreign Key Integrity Check' as test_name,
    'employees -> salaries' as relationship,
    COUNT(*) as orphaned_records
FROM salaries s
LEFT JOIN employees e ON e.id = s.employee_id
WHERE e.id IS NULL;

SELECT 
    'Foreign Key Integrity Check' as test_name,
    'receivables -> receivable_payments' as relationship,
    COUNT(*) as orphaned_records
FROM receivable_payments rp
LEFT JOIN receivables r ON r.id = rp.receivable_id
WHERE r.id IS NULL;

-- ✅ 2. فحص سلامة البيانات الأساسية
-- =================================

-- فحص القيم الفارغة في الحقول المطلوبة
SELECT 'NULL Values Check' as test_name, 'projects.name' as field, 
       COUNT(*) as null_count
FROM projects WHERE name IS NULL OR name = '';

SELECT 'NULL Values Check' as test_name, 'projects.budget' as field, 
       COUNT(*) as null_count
FROM projects WHERE budget IS NULL OR budget < 0;

SELECT 'NULL Values Check' as test_name, 'employees.name' as field, 
       COUNT(*) as null_count
FROM employees WHERE name IS NULL OR name = '';

SELECT 'NULL Values Check' as test_name, 'employees.salary' as field, 
       COUNT(*) as null_count
FROM employees WHERE salary IS NULL OR salary < 0;

SELECT 'NULL Values Check' as test_name, 'transactions.amount' as field, 
       COUNT(*) as null_count
FROM transactions WHERE amount IS NULL OR amount <= 0;

SELECT 'NULL Values Check' as test_name, 'receivables.amount' as field, 
       COUNT(*) as null_count
FROM receivables WHERE amount IS NULL OR amount <= 0;

-- ✅ 3. فحص التناسق في البيانات المالية
-- ====================================

-- فحص أن مجموع المدفوعات لا يتجاوز المبلغ المطلوب
SELECT 
    'Payment Consistency Check' as test_name,
    r.beneficiary_name,
    r.amount as total_amount,
    SUM(rp.amount) as total_paid,
    CASE 
        WHEN SUM(rp.amount) > r.amount THEN 'OVERPAID'
        ELSE 'OK'
    END as status
FROM receivables r
LEFT JOIN receivable_payments rp ON rp.receivable_id = r.id
WHERE r.created_by = auth.uid()
GROUP BY r.id, r.beneficiary_name, r.amount
HAVING SUM(rp.amount) > r.amount;

-- فحص تناسق الرواتب مع الموظفين
SELECT 
    'Salary Consistency Check' as test_name,
    e.name as employee_name,
    e.salary as base_salary,
    s.amount as paid_salary,
    s.month,
    CASE 
        WHEN s.amount > e.salary THEN 'OVERPAID'
        WHEN s.amount < e.salary THEN 'UNDERPAID'
        ELSE 'OK'
    END as status
FROM employees e
JOIN salaries s ON s.employee_id = e.id
WHERE e.created_by = auth.uid()
AND s.amount != e.salary;

-- ✅ 4. فحص التواريخ والقيم المنطقية
-- ===================================

-- فحص التواريخ المستقبلية في المعاملات
SELECT 
    'Date Validation Check' as test_name,
    'Future transaction dates' as issue,
    COUNT(*) as problematic_records
FROM transactions 
WHERE date > CURRENT_DATE
AND created_by = auth.uid();

-- فحص التواريخ المستقبلية في المدفوعات
SELECT 
    'Date Validation Check' as test_name,
    'Future payment dates' as issue,
    COUNT(*) as problematic_records
FROM receivable_payments rp
JOIN receivables r ON r.id = rp.receivable_id
WHERE rp.payment_date > CURRENT_DATE
AND r.created_by = auth.uid();

-- فحص التواريخ المستقبلية في الرواتب
SELECT 
    'Date Validation Check' as test_name,
    'Future salary payments' as issue,
    COUNT(*) as problematic_records
FROM salaries s
JOIN employees e ON e.id = s.employee_id
WHERE s.payment_date > CURRENT_DATE
AND e.created_by = auth.uid();

-- ✅ 5. فحص التكرارات غير المرغوبة
-- =================================

-- فحص تكرار أسماء المشاريع للمستخدم الواحد
SELECT 
    'Duplicate Check' as test_name,
    'Duplicate project names' as issue,
    name,
    COUNT(*) as duplicate_count
FROM projects 
WHERE created_by = auth.uid()
GROUP BY name, created_by
HAVING COUNT(*) > 1;

-- فحص تكرار الرواتب لنفس الموظف في نفس الشهر
SELECT 
    'Duplicate Check' as test_name,
    'Duplicate salary payments' as issue,
    e.name as employee_name,
    s.month,
    COUNT(*) as duplicate_count
FROM salaries s
JOIN employees e ON e.id = s.employee_id
WHERE e.created_by = auth.uid()
GROUP BY e.id, e.name, s.month
HAVING COUNT(*) > 1;

-- ✅ 6. فحص الأدوار والصلاحيات
-- ============================

-- فحص أن كل مشروع له مالك واحد على الأقل
SELECT 
    'Role Validation Check' as test_name,
    'Projects without owners' as issue,
    p.name as project_name
FROM projects p
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.project_id = p.id AND ur.role = 'owner'
)
AND p.created_by = auth.uid();

-- فحص الأدوار المكررة للمستخدم الواحد في المشروع الواحد
SELECT 
    'Role Validation Check' as test_name,
    'Duplicate user roles' as issue,
    ur.user_id,
    p.name as project_name,
    COUNT(*) as role_count
FROM user_roles ur
JOIN projects p ON p.id = ur.project_id
WHERE p.created_by = auth.uid()
GROUP BY ur.user_id, ur.project_id, p.name
HAVING COUNT(*) > 1;

-- ✅ 7. فحص التسلسل والترقيم
-- ==========================

-- فحص تسلسل الملفات الشخصية
SELECT 
    'Sequence Check' as test_name,
    'Profile sequence integrity' as check_type,
    COUNT(*) as profile_count,
    COUNT(DISTINCT id) as unique_ids
FROM profiles;

-- فحص أن جميع المستخدمين لديهم ملفات شخصية
SELECT 
    'Profile Completeness Check' as test_name,
    'Users without profiles' as issue,
    COUNT(*) as missing_profiles
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ✅ 8. فحص الأمان والصلاحيات
-- ============================

-- فحص أن جميع الجداول لها سياسات RLS
SELECT 
    'Security Check' as test_name,
    t.tablename,
    CASE 
        WHEN t.rowsecurity THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as rls_status
FROM pg_tables t
WHERE t.schemaname = 'public'
AND t.tablename IN (
    'projects', 'transactions', 'employees', 'documents', 
    'receivables', 'receivable_payments', 'ledger_entries',
    'activity_logs', 'salaries', 'user_roles', 'profiles'
);

-- فحص سياسات RLS المطبقة
SELECT 
    'RLS Policy Check' as test_name,
    pol.tablename,
    pol.policyname,
    pol.permissive,
    pol.cmd as command_type
FROM pg_policies pol
WHERE pol.schemaname = 'public'
ORDER BY pol.tablename, pol.policyname;

-- ✅ 9. فحص الوظائف والمحفزات
-- ============================

-- فحص المحفزات المفعلة
SELECT 
    'Trigger Check' as test_name,
    t.tgname as trigger_name,
    c.relname as table_name,
    CASE t.tgenabled
        WHEN 'O' THEN 'Enabled'
        WHEN 'D' THEN 'Disabled'
        ELSE 'Unknown'
    END as status
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname IN (
    'projects', 'transactions', 'employees', 'documents', 
    'receivables', 'receivable_payments', 'ledger_entries',
    'activity_logs', 'salaries', 'user_roles', 'profiles'
)
AND NOT t.tgisinternal;

-- فحص الوظائف المخصصة
SELECT 
    'Function Check' as test_name,
    p.proname as function_name,
    p.pronargs as arg_count,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname LIKE '%update%' OR p.proname LIKE '%trigger%';

-- ✅ 10. فحص شامل لسلامة النظام
-- ==============================

-- تقرير شامل لحالة النظام
WITH system_health AS (
    SELECT 
        'projects' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as null_names,
        COUNT(CASE WHEN budget IS NULL OR budget < 0 THEN 1 END) as invalid_budgets
    FROM projects WHERE created_by = auth.uid()
    
    UNION ALL
    
    SELECT 
        'transactions',
        COUNT(*),
        COUNT(CASE WHEN description IS NULL OR description = '' THEN 1 END),
        COUNT(CASE WHEN amount IS NULL OR amount <= 0 THEN 1 END)
    FROM transactions WHERE created_by = auth.uid()
    
    UNION ALL
    
    SELECT 
        'employees',
        COUNT(*),
        COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END),
        COUNT(CASE WHEN salary IS NULL OR salary < 0 THEN 1 END)
    FROM employees WHERE created_by = auth.uid()
    
    UNION ALL
    
    SELECT 
        'receivables',
        COUNT(*),
        COUNT(CASE WHEN beneficiary_name IS NULL OR beneficiary_name = '' THEN 1 END),
        COUNT(CASE WHEN amount IS NULL OR amount <= 0 THEN 1 END)
    FROM receivables WHERE created_by = auth.uid()
)
SELECT 
    'INTEGRITY_TEST_SUMMARY' as test_type,
    table_name,
    total_records,
    null_names as data_quality_issues,
    invalid_budgets as validation_errors,
    CASE 
        WHEN null_names = 0 AND invalid_budgets = 0 THEN 'HEALTHY'
        WHEN null_names + invalid_budgets < total_records * 0.1 THEN 'MINOR_ISSUES'
        ELSE 'NEEDS_ATTENTION'
    END as health_status
FROM system_health
ORDER BY total_records DESC;
