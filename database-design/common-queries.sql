-- ===================================================================
-- استعلامات شائعة وتقارير - نظام المحاسبة العربي
-- Common Queries and Reports - Arabic Accounting System
-- ===================================================================

-- ===================================================================
-- 1. تقارير مالية أساسية
-- ===================================================================

-- إجمالي الدخل والمصاريف لشهر معين
SELECT 
    EXTRACT(YEAR FROM date) as السنة,
    EXTRACT(MONTH FROM date) as الشهر,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as إجمالي_الدخل,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as إجمالي_المصاريف,
    SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as صافي_الربح
FROM transactions 
WHERE status = 'completed'
    AND date >= '2024-01-01' 
    AND date < '2024-04-01'
GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
ORDER BY السنة, الشهر;

-- تفصيل المصاريف حسب النوع
SELECT 
    et.name as نوع_المصروف,
    COUNT(t.id) as عدد_المعاملات,
    SUM(t.amount) as إجمالي_المبلغ,
    AVG(t.amount) as متوسط_المبلغ,
    ROUND((SUM(t.amount) * 100.0 / (
        SELECT SUM(amount) FROM transactions 
        WHERE type = 'expense' AND status = 'completed'
    )), 2) as النسبة_المئوية
FROM transactions t
JOIN expense_types et ON t.expense_type_id = et.id
WHERE t.type = 'expense' AND t.status = 'completed'
GROUP BY et.id, et.name
ORDER BY إجمالي_المبلغ DESC;

-- ===================================================================
-- 2. تقارير المشاريع
-- ===================================================================

-- حالة جميع المشاريع مع التفاصيل المالية
SELECT 
    p.id,
    p.name as اسم_المشروع,
    p.status as الحالة,
    p.budget as الميزانية,
    p.spent_amount as المبلغ_المنفق,
    p.budget - p.spent_amount as المبلغ_المتبقي,
    ROUND((p.spent_amount * 100.0 / NULLIF(p.budget, 0)), 2) as نسبة_الإنفاق,
    p.progress as التقدم,
    p.start_date as تاريخ_البداية,
    p.end_date as تاريخ_النهاية,
    CASE 
        WHEN p.end_date < CURRENT_DATE AND p.status != 'completed' THEN 'متأخر'
        WHEN p.end_date - CURRENT_DATE <= 7 AND p.status = 'active' THEN 'ينتهي قريباً'
        ELSE 'في الموعد'
    END as حالة_الموعد
FROM projects p
ORDER BY p.created_at DESC;

-- تفاصيل الدخل لكل مشروع
SELECT 
    p.name as المشروع,
    COUNT(t.id) as عدد_الدفعات,
    SUM(t.amount) as إجمالي_الدخل,
    MIN(t.date) as أول_دفعة,
    MAX(t.date) as آخر_دفعة,
    p.budget - COALESCE(SUM(te.amount), 0) as الميزانية_المتبقية
FROM projects p
LEFT JOIN transactions t ON p.id = t.project_id AND t.type = 'income' AND t.status = 'completed'
LEFT JOIN transactions te ON p.id = te.project_id AND te.type = 'expense' AND te.status = 'completed'
GROUP BY p.id, p.name, p.budget
ORDER BY إجمالي_الدخل DESC;

-- ===================================================================
-- 3. تقارير الموظفين والرواتب
-- ===================================================================

-- إجمالي الرواتب المدفوعة لكل موظف
SELECT 
    e.full_name as اسم_الموظف,
    e.position as المنصب,
    e.department as القسم,
    e.salary as الراتب_الأساسي,
    COUNT(t.id) as عدد_الدفعات,
    SUM(t.amount) as إجمالي_المدفوع,
    DATE_PART('month', AGE(CURRENT_DATE, e.hire_date)) + 
    DATE_PART('year', AGE(CURRENT_DATE, e.hire_date)) * 12 as شهور_العمل
FROM employees e
LEFT JOIN transactions t ON e.id = t.employee_id AND t.type = 'expense' AND t.status = 'completed'
WHERE e.is_active = true
GROUP BY e.id, e.full_name, e.position, e.department, e.salary, e.hire_date
ORDER BY إجمالي_المدفوع DESC;

-- تقرير المشاريع المخصصة لكل موظف
SELECT 
    e.full_name as الموظف,
    p.name as المشروع,
    ep.role as الدور,
    ep.hourly_rate as السعر_بالساعة,
    ep.start_date as تاريخ_البداية,
    ep.is_active as نشط,
    COALESCE(SUM(cw.hours_spent), 0) as الساعات_المعمولة
FROM employees e
JOIN employee_projects ep ON e.id = ep.employee_id
JOIN projects p ON ep.project_id = p.id
LEFT JOIN completed_works cw ON p.id = cw.project_id AND e.id = cw.completed_by
GROUP BY e.id, e.full_name, p.id, p.name, ep.role, ep.hourly_rate, ep.start_date, ep.is_active
ORDER BY e.full_name, p.name;

-- ===================================================================
-- 4. تقارير المدفوعات المؤجلة
-- ===================================================================

-- المدفوعات المستحقة والمتأخرة
SELECT 
    dp.title as العنوان,
    dp.amount as المبلغ,
    dp.due_date as تاريخ_الاستحقاق,
    CURRENT_DATE - dp.due_date as أيام_التأخير,
    dp.status as الحالة,
    dp.priority as الأولوية,
    p.name as المشروع,
    dp.client_name as العميل,
    CASE 
        WHEN dp.due_date < CURRENT_DATE THEN 'متأخر'
        WHEN dp.due_date - CURRENT_DATE <= 7 THEN 'مستحق قريباً'
        ELSE 'في الموعد'
    END as حالة_الدفعة
FROM deferred_payments dp
LEFT JOIN projects p ON dp.project_id = p.id
WHERE dp.status = 'pending'
ORDER BY dp.due_date ASC;

-- ملخص المدفوعات المؤجلة حسب الحالة
SELECT 
    status as الحالة,
    COUNT(*) as العدد,
    SUM(amount) as إجمالي_المبلغ,
    AVG(amount) as متوسط_المبلغ
FROM deferred_payments
GROUP BY status
ORDER BY إجمالي_المبلغ DESC;

-- ===================================================================
-- 5. تقارير الأعمال المكتملة
-- ===================================================================

-- إنتاجية الموظفين من خلال الأعمال المكتملة
SELECT 
    u.full_name as الموظف,
    COUNT(cw.id) as عدد_الأعمال_المكتملة,
    SUM(cw.hours_spent) as إجمالي_الساعات,
    AVG(cw.hours_spent) as متوسط_الساعات,
    AVG(cw.quality_rating) as متوسط_التقييم,
    SUM(cw.hours_spent) / NULLIF(SUM(cw.estimated_hours), 0) * 100 as نسبة_الدقة_في_التقدير
FROM users u
JOIN completed_works cw ON u.id = cw.completed_by
GROUP BY u.id, u.full_name
ORDER BY عدد_الأعمال_المكتملة DESC;

-- تفاصيل الأعمال المكتملة لكل مشروع
SELECT 
    p.name as المشروع,
    COUNT(cw.id) as عدد_الأعمال,
    SUM(cw.hours_spent) as إجمالي_الساعات,
    AVG(cw.quality_rating) as متوسط_الجودة,
    COUNT(CASE WHEN cw.client_approval = true THEN 1 END) as الأعمال_المعتمدة,
    ROUND(
        COUNT(CASE WHEN cw.client_approval = true THEN 1 END) * 100.0 / 
        NULLIF(COUNT(cw.id), 0), 2
    ) as نسبة_الاعتماد
FROM projects p
LEFT JOIN completed_works cw ON p.id = cw.project_id
GROUP BY p.id, p.name
ORDER BY عدد_الأعمال DESC;

-- ===================================================================
-- 6. تقارير استخدام النظام
-- ===================================================================

-- نشاط المستخدمين
SELECT 
    u.full_name as المستخدم,
    u.role as الدور,
    COUNT(al.id) as عدد_الأنشطة,
    MAX(al.created_at) as آخر_نشاط,
    COUNT(CASE WHEN al.action = 'login' THEN 1 END) as مرات_تسجيل_الدخول,
    COUNT(CASE WHEN al.action = 'create' THEN 1 END) as عمليات_الإنشاء,
    COUNT(CASE WHEN al.action = 'update' THEN 1 END) as عمليات_التحديث,
    COUNT(CASE WHEN al.action = 'delete' THEN 1 END) as عمليات_الحذف
FROM users u
LEFT JOIN activity_logs al ON u.id = al.user_id
WHERE al.created_at >= CURRENT_DATE - INTERVAL '30 days' OR al.created_at IS NULL
GROUP BY u.id, u.full_name, u.role
ORDER BY عدد_الأنشطة DESC;

-- الإشعارات غير المقروءة
SELECT 
    u.full_name as المستخدم,
    COUNT(n.id) as الإشعارات_غير_المقروءة,
    COUNT(CASE WHEN n.type = 'warning' THEN 1 END) as تحذيرات,
    COUNT(CASE WHEN n.type = 'error' THEN 1 END) as أخطاء,
    MIN(n.created_at) as أقدم_إشعار
FROM users u
LEFT JOIN notifications n ON u.id = n.user_id AND n.is_read = false
GROUP BY u.id, u.full_name
HAVING COUNT(n.id) > 0
ORDER BY الإشعارات_غير_المقروءة DESC;

-- ===================================================================
-- 7. تقارير الوثائق والملفات
-- ===================================================================

-- إحصائيات الوثائق
SELECT 
    category as الفئة,
    COUNT(*) as عدد_الملفات,
    SUM(file_size) as الحجم_الإجمالي,
    AVG(file_size) as متوسط_الحجم,
    COUNT(CASE WHEN visibility = 'public' THEN 1 END) as الملفات_العامة,
    COUNT(CASE WHEN visibility = 'private' THEN 1 END) as الملفات_الخاصة
FROM documents
GROUP BY category
ORDER BY عدد_الملفات DESC;

-- الملفات الأكثر حجماً
SELECT 
    title as العنوان,
    file_name as اسم_الملف,
    ROUND(file_size / 1024.0 / 1024.0, 2) as الحجم_بالميجابايت,
    category as الفئة,
    u.full_name as رافع_الملف,
    uploaded_at as تاريخ_الرفع
FROM documents d
JOIN users u ON d.uploaded_by = u.id
ORDER BY file_size DESC
LIMIT 10;

-- ===================================================================
-- 8. تقارير الميزانية والتحكم المالي
-- ===================================================================

-- تتبع الميزانيات والانحرافات
SELECT 
    p.name as المشروع,
    et.name as نوع_المصروف,
    bt.planned_amount as المبلغ_المخطط,
    bt.actual_amount as المبلغ_الفعلي,
    bt.planned_amount - bt.actual_amount as الانحراف,
    ROUND((bt.actual_amount * 100.0 / NULLIF(bt.planned_amount, 0)), 2) as نسبة_الاستخدام,
    bt.period_start as بداية_الفترة,
    bt.period_end as نهاية_الفترة,
    CASE 
        WHEN bt.actual_amount > bt.planned_amount THEN 'تجاوز الميزانية'
        WHEN bt.actual_amount >= bt.planned_amount * 0.9 THEN 'قريب من الحد'
        ELSE 'ضمن الحدود'
    END as حالة_الميزانية
FROM budget_tracking bt
JOIN projects p ON bt.project_id = p.id
LEFT JOIN expense_types et ON bt.expense_type_id = et.id
ORDER BY نسبة_الاستخدام DESC;

-- ===================================================================
-- 9. تقارير الأداء الزمني
-- ===================================================================

-- اتجاه الدخل الشهري
WITH monthly_income AS (
    SELECT 
        DATE_TRUNC('month', date) as شهر,
        SUM(amount) as دخل_الشهر
    FROM transactions 
    WHERE type = 'income' AND status = 'completed'
    GROUP BY DATE_TRUNC('month', date)
)
SELECT 
    شهر,
    دخل_الشهر,
    LAG(دخل_الشهر) OVER (ORDER BY شهر) as دخل_الشهر_السابق,
    دخل_الشهر - LAG(دخل_الشهر) OVER (ORDER BY شهر) as الفرق,
    ROUND(
        (دخل_الشهر - LAG(دخل_الشهر) OVER (ORDER BY شهر)) * 100.0 / 
        NULLIF(LAG(دخل_الشهر) OVER (ORDER BY شهر), 0), 2
    ) as نسبة_النمو
FROM monthly_income
ORDER BY شهر;

-- اتجاه المصاريف حسب النوع
SELECT 
    et.name as نوع_المصروف,
    DATE_TRUNC('month', t.date) as الشهر,
    SUM(t.amount) as إجمالي_المصروف,
    COUNT(t.id) as عدد_المعاملات,
    AVG(t.amount) as متوسط_المعاملة
FROM transactions t
JOIN expense_types et ON t.expense_type_id = et.id
WHERE t.type = 'expense' AND t.status = 'completed'
GROUP BY et.id, et.name, DATE_TRUNC('month', t.date)
ORDER BY الشهر DESC, إجمالي_المصروف DESC;

-- ===================================================================
-- 10. استعلامات للتحليل المتقدم
-- ===================================================================

-- تحليل العملاء والمشاريع
SELECT 
    p.client_name as العميل,
    COUNT(p.id) as عدد_المشاريع,
    SUM(p.budget) as إجمالي_الميزانيات,
    SUM(
        COALESCE((
            SELECT SUM(amount) FROM transactions 
            WHERE project_id = p.id AND type = 'income' AND status = 'completed'
        ), 0)
    ) as إجمالي_الدخل,
    AVG(p.progress) as متوسط_التقدم,
    COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as المشاريع_المكتملة,
    COUNT(CASE WHEN p.status = 'active' THEN 1 END) as المشاريع_النشطة
FROM projects p
GROUP BY p.client_name
HAVING COUNT(p.id) > 0
ORDER BY إجمالي_الدخل DESC;

-- تحليل الكفاءة الزمنية للمشاريع
SELECT 
    p.name as المشروع,
    p.start_date,
    p.end_date,
    CASE 
        WHEN p.end_date IS NOT NULL THEN p.end_date - p.start_date
        ELSE CURRENT_DATE - p.start_date
    END as المدة_بالأيام,
    p.budget,
    p.spent_amount,
    ROUND(p.spent_amount / NULLIF(
        EXTRACT(DAYS FROM (
            CASE 
                WHEN p.end_date IS NOT NULL THEN p.end_date - p.start_date
                ELSE CURRENT_DATE - p.start_date
            END
        )), 0
    ), 2) as متوسط_الإنفاق_اليومي,
    SUM(cw.hours_spent) as إجمالي_ساعات_العمل,
    ROUND(
        SUM(cw.hours_spent) / NULLIF(
            EXTRACT(DAYS FROM (
                CASE 
                    WHEN p.end_date IS NOT NULL THEN p.end_date - p.start_date
                    ELSE CURRENT_DATE - p.start_date
                END
            )), 0
        ), 2
    ) as متوسط_ساعات_العمل_اليومية
FROM projects p
LEFT JOIN completed_works cw ON p.id = cw.project_id
GROUP BY p.id, p.name, p.start_date, p.end_date, p.budget, p.spent_amount
ORDER BY المدة_بالأيام DESC;

-- ===================================================================
-- 11. استعلامات للمراقبة والتنبيهات
-- ===================================================================

-- المشاريع التي تحتاج انتباه
SELECT 
    p.name as المشروع,
    p.status as الحالة,
    p.progress as التقدم,
    ROUND((p.spent_amount * 100.0 / NULLIF(p.budget, 0)), 2) as نسبة_الإنفاق,
    p.end_date as موعد_الانتهاء,
    CASE 
        WHEN p.end_date < CURRENT_DATE AND p.status != 'completed' THEN 'متأخر'
        WHEN p.spent_amount > p.budget * 0.9 THEN 'تجاوز الميزانية'
        WHEN p.end_date - CURRENT_DATE <= 14 AND p.status = 'active' THEN 'ينتهي قريباً'
        WHEN p.progress < 50 AND (CURRENT_DATE - p.start_date) > 90 THEN 'تقدم بطيء'
        ELSE 'طبيعي'
    END as نوع_التنبيه
FROM projects p
WHERE 
    (p.end_date < CURRENT_DATE AND p.status != 'completed') OR
    (p.spent_amount > p.budget * 0.9) OR
    (p.end_date - CURRENT_DATE <= 14 AND p.status = 'active') OR
    (p.progress < 50 AND (CURRENT_DATE - p.start_date) > 90)
ORDER BY 
    CASE 
        WHEN p.end_date < CURRENT_DATE AND p.status != 'completed' THEN 1
        WHEN p.spent_amount > p.budget THEN 2
        WHEN p.end_date - CURRENT_DATE <= 7 THEN 3
        ELSE 4
    END;

-- المعاملات المشكوك فيها أو التي تحتاج مراجعة
SELECT 
    t.id,
    t.date,
    t.type,
    t.amount,
    t.description,
    p.name as المشروع,
    u.full_name as منشئ_المعاملة,
    CASE 
        WHEN t.amount > 5000 THEN 'مبلغ كبير'
        WHEN t.created_at != DATE(t.date) AND ABS(EXTRACT(DAYS FROM (t.created_at - t.date))) > 7 THEN 'فرق زمني كبير'
        WHEN t.description IS NULL OR LENGTH(t.description) < 10 THEN 'وصف ناقص'
        ELSE 'أخرى'
    END as سبب_المراجعة
FROM transactions t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN users u ON t.created_by = u.id
WHERE 
    t.amount > 5000 OR
    (t.created_at != DATE(t.date) AND ABS(EXTRACT(DAYS FROM (t.created_at - t.date))) > 7) OR
    t.description IS NULL OR 
    LENGTH(t.description) < 10
ORDER BY t.amount DESC, t.date DESC;

-- ===================================================================
-- 12. إحصائيات عامة للوحة التحكم
-- ===================================================================

-- إحصائيات سريعة لوحة التحكم
SELECT 
    'إجمالي المشاريع' as المؤشر,
    COUNT(*)::text as القيمة
FROM projects
UNION ALL
SELECT 'المشاريع النشطة', COUNT(*)::text FROM projects WHERE status = 'active'
UNION ALL
SELECT 'إجمالي المعاملات', COUNT(*)::text FROM transactions WHERE status = 'completed'
UNION ALL
SELECT 'الدخل هذا الشهر', COALESCE(SUM(amount), 0)::text 
FROM transactions 
WHERE type = 'income' 
    AND status = 'completed' 
    AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
UNION ALL
SELECT 'المصاريف هذا الشهر', COALESCE(SUM(amount), 0)::text 
FROM transactions 
WHERE type = 'expense' 
    AND status = 'completed' 
    AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
UNION ALL
SELECT 'المدفوعات المعلقة', COUNT(*)::text FROM deferred_payments WHERE status = 'pending'
UNION ALL
SELECT 'الإشعارات غير المقروءة', COUNT(*)::text FROM notifications WHERE is_read = false
UNION ALL
SELECT 'الموظفين النشطين', COUNT(*)::text FROM employees WHERE is_active = true;

-- ===================================================================
-- نهاية الاستعلامات والتقارير
-- ===================================================================
