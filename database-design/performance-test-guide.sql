-- ⚡ دليل فحص الأداء والاستعلامات
-- =================================

-- ✅ 1. فحص سرعة الاستعلامات الأساسية
-- ===================================

-- فحص استعلام المشاريع مع إحصائيات
EXPLAIN ANALYZE 
SELECT 
    p.*,
    COUNT(t.id) as transaction_count,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses
FROM projects p
LEFT JOIN transactions t ON t.project_id = p.id
WHERE p.created_by = auth.uid()
GROUP BY p.id
ORDER BY p.created_at DESC;

-- فحص استعلام الموظفين مع راتب المجموع
EXPLAIN ANALYZE
SELECT 
    e.*,
    p.name as project_name,
    COALESCE(SUM(s.amount), 0) as total_paid_salary
FROM employees e
LEFT JOIN projects p ON p.id = e.assigned_project_id
LEFT JOIN salaries s ON s.employee_id = e.id
WHERE e.created_by = auth.uid()
GROUP BY e.id, p.name
ORDER BY e.created_at DESC;

-- ✅ 2. فحص استعلامات التقارير المعقدة
-- ===================================

-- تقرير شامل للمشروع
EXPLAIN ANALYZE
SELECT 
    p.name as project_name,
    p.budget,
    COUNT(DISTINCT e.id) as employee_count,
    COUNT(DISTINCT t.id) as transaction_count,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses,
    p.budget - SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as remaining_budget
FROM projects p
LEFT JOIN employees e ON e.assigned_project_id = p.id
LEFT JOIN transactions t ON t.project_id = p.id
WHERE EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.project_id = p.id
) OR p.created_by = auth.uid()
GROUP BY p.id, p.name, p.budget
ORDER BY p.created_at DESC;

-- تقرير المستحقات مع المدفوعات
EXPLAIN ANALYZE
SELECT 
    r.beneficiary_name,
    r.amount as total_amount,
    COALESCE(SUM(rp.amount), 0) as total_paid,
    r.amount - COALESCE(SUM(rp.amount), 0) as remaining_amount,
    CASE 
        WHEN r.amount <= COALESCE(SUM(rp.amount), 0) THEN 'مكتمل'
        WHEN COALESCE(SUM(rp.amount), 0) > 0 THEN 'جزئي'
        ELSE 'غير مدفوع'
    END as payment_status
FROM receivables r
LEFT JOIN receivable_payments rp ON rp.receivable_id = r.id
WHERE r.created_by = auth.uid()
GROUP BY r.id, r.beneficiary_name, r.amount
ORDER BY r.created_at DESC;

-- ✅ 3. فحص فهارس الأداء
-- =======================

-- فحص الفهارس المستخدمة
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN (
    'projects', 'transactions', 'employees', 'documents', 
    'receivables', 'receivable_payments', 'ledger_entries',
    'activity_logs', 'salaries', 'user_roles', 'profiles'
)
ORDER BY tablename, indexname;

-- فحص استخدام الفهارس في الاستعلامات
SELECT 
    'Index usage for projects table' as test_name,
    COUNT(*) as records
FROM projects 
WHERE created_by = auth.uid()
AND created_at >= CURRENT_DATE - INTERVAL '30 days';

SELECT 
    'Index usage for transactions table' as test_name,
    COUNT(*) as records
FROM transactions 
WHERE project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
)
AND date >= CURRENT_DATE - INTERVAL '30 days';

-- ✅ 4. فحص حجم البيانات والذاكرة
-- =================================

-- فحص حجم الجداول
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(table_name::regclass)) as size,
    pg_total_relation_size(table_name::regclass) as size_bytes
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'projects', 'transactions', 'employees', 'documents', 
    'receivables', 'receivable_payments', 'ledger_entries',
    'activity_logs', 'salaries', 'user_roles', 'profiles'
)
ORDER BY size_bytes DESC;

-- فحص عدد السجلات في كل جدول
SELECT 
    'projects' as table_name, COUNT(*) as record_count 
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
SELECT 'receivable_payments', COUNT(*) FROM receivable_payments
UNION ALL
SELECT 'ledger_entries', COUNT(*) FROM ledger_entries
UNION ALL
SELECT 'activity_logs', COUNT(*) FROM activity_logs
UNION ALL
SELECT 'salaries', COUNT(*) FROM salaries
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
ORDER BY record_count DESC;

-- ✅ 5. فحص الاستعلامات البطيئة
-- ==============================

-- فحص الاستعلامات المعقدة مع التحليل
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
    p.name as project_name,
    ur.role as user_role,
    COUNT(DISTINCT t.id) as transactions,
    COUNT(DISTINCT e.id) as employees,
    COUNT(DISTINCT d.id) as documents,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expenses
FROM projects p
JOIN user_roles ur ON ur.project_id = p.id
LEFT JOIN transactions t ON t.project_id = p.id
LEFT JOIN employees e ON e.assigned_project_id = p.id  
LEFT JOIN documents d ON d.created_by = p.created_by
WHERE ur.user_id = auth.uid()
GROUP BY p.id, p.name, ur.role
ORDER BY p.created_at DESC;

-- ✅ 6. فحص أداء العمليات المتزامنة
-- ==================================

-- فحص إدراج متعدد للمعاملات
BEGIN;
WITH sample_project AS (
    SELECT id FROM projects WHERE created_by = auth.uid() LIMIT 1
)
INSERT INTO transactions (type, amount, description, date, project_id, created_by)
SELECT 
    CASE WHEN generate_series % 2 = 0 THEN 'income' ELSE 'expense' END,
    (random() * 1000)::decimal(10,2),
    'اختبار الأداء رقم ' || generate_series,
    CURRENT_DATE - (random() * 365)::int,
    sp.id,
    auth.uid()
FROM generate_series(1, 100), sample_project sp;

-- فحص الاستعلام بعد الإدراج
SELECT 
    'Performance test transactions created' as status,
    COUNT(*) as count
FROM transactions 
WHERE description LIKE 'اختبار الأداء%';

ROLLBACK; -- إلغاء الاختبار

-- ✅ 7. فحص استعلامات التجميع والإحصائيات
-- ========================================

-- إحصائيات شاملة للنظام
SELECT 
    'System Statistics' as report_type,
    (SELECT COUNT(*) FROM projects WHERE created_by = auth.uid()) as my_projects,
    (SELECT COUNT(*) FROM transactions WHERE created_by = auth.uid()) as my_transactions,
    (SELECT COUNT(*) FROM employees WHERE created_by = auth.uid()) as my_employees,
    (SELECT COUNT(*) FROM documents WHERE created_by = auth.uid()) as my_documents,
    (SELECT COUNT(*) FROM receivables WHERE created_by = auth.uid()) as my_receivables,
    (SELECT COUNT(*) FROM ledger_entries WHERE created_by = auth.uid()) as my_ledger_entries,
    (SELECT SUM(amount) FROM transactions WHERE created_by = auth.uid() AND type = 'income') as total_income,
    (SELECT SUM(amount) FROM transactions WHERE created_by = auth.uid() AND type = 'expense') as total_expenses;

-- إحصائيات الأداء الشهرية
SELECT 
    DATE_TRUNC('month', t.date) as month,
    COUNT(*) as transaction_count,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as monthly_income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as monthly_expenses,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as net_amount
FROM transactions t
WHERE t.created_by = auth.uid()
AND t.date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', t.date)
ORDER BY month DESC;

-- ✅ 8. فحص الذاكرة المؤقتة والتحسينات
-- =====================================

-- إحصائيات ذاكرة التخزين المؤقت
SELECT 
    'Cache Hit Ratio' as metric,
    ROUND(
        100.0 * SUM(blks_hit) / NULLIF(SUM(blks_hit) + SUM(blks_read), 0), 2
    ) as percentage
FROM pg_stat_database 
WHERE datname = current_database();

-- إحصائيات الجداول الأكثر استخداماً
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables 
WHERE tablename IN (
    'projects', 'transactions', 'employees', 'documents', 
    'receivables', 'receivable_payments', 'ledger_entries'
)
ORDER BY seq_scan + idx_scan DESC;

-- ✅ 9. توصيات التحسين
-- =====================

-- البحث عن الجداول بدون فهارس مناسبة
SELECT 
    'Missing Index Recommendation' as recommendation,
    tablename,
    'Consider adding index for frequently queried columns' as suggestion
FROM pg_stat_user_tables
WHERE tablename IN ('projects', 'transactions', 'employees', 'documents')
AND seq_scan > 100 
AND seq_scan > idx_scan;

-- فحص الاستعلامات التي تحتاج تحسين
SELECT 
    'Query Optimization Needed' as recommendation,
    'Review slow queries and add appropriate indexes' as suggestion
FROM pg_stat_statements 
WHERE mean_time > 100
LIMIT 5;

-- ✅ 10. ملخص فحص الأداء
-- ======================

SELECT 
    'PERFORMANCE_TEST_SUMMARY' as test_type,
    'Database performance analysis completed' as status,
    CURRENT_TIMESTAMP as test_time,
    'Check EXPLAIN ANALYZE results for query optimization' as note;
