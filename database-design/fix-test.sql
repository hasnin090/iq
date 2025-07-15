-- 🔧 اختبار إصلاح مشاكل المعاملات والمشاريع
-- ==============================================

-- ✅ 1. اختبار إنشاء مشروع جديد
-- ==============================

-- إنشاء مشروع جديد
INSERT INTO projects (name, description, budget, created_by) 
VALUES ('مشروع اختبار الإصلاح', 'اختبار إصلاح مشاكل العرض', 100000.00, auth.uid())
RETURNING id, name, 'مشروع تم إنشاؤه بنجاح' as status;

-- التحقق من إضافة المالك تلقائياً في user_roles
SELECT 
    'تحقق من إضافة المالك تلقائياً' as test_name,
    p.name as project_name,
    ur.role,
    'تم إضافة المالك تلقائياً' as result
FROM projects p
JOIN user_roles ur ON ur.project_id = p.id
WHERE p.name = 'مشروع اختبار الإصلاح' 
AND ur.user_id = auth.uid()
AND ur.role = 'owner';

-- ✅ 2. اختبار عرض المشاريع بعد الإنشاء
-- =======================================

-- يجب أن يظهر المشروع المنشأ حديثاً
SELECT 
    'اختبار عرض المشاريع' as test_name,
    COUNT(*) as project_count,
    'المشاريع ظاهرة بنجاح' as result
FROM projects 
WHERE name = 'مشروع اختبار الإصلاح' 
AND created_by = auth.uid();

-- عرض جميع المشاريع التي يمكن للمستخدم رؤيتها
SELECT 
    'جميع المشاريع المرئية' as test_name,
    p.name,
    p.budget,
    CASE 
        WHEN p.created_by = auth.uid() THEN 'منشئ المشروع'
        ELSE 'عضو في المشروع'
    END as relationship
FROM projects p
WHERE p.created_by = auth.uid() 
OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.project_id = p.id)
ORDER BY p.created_at DESC;

-- ✅ 3. اختبار إنشاء معاملة للمشروع
-- =================================

-- إنشاء معاملة دخل
INSERT INTO transactions (type, amount, description, date, project_id, created_by)
SELECT 
    'income',
    5000.00,
    'دفعة مقدمة لمشروع الاختبار',
    CURRENT_DATE,
    p.id,
    auth.uid()
FROM projects p
WHERE p.name = 'مشروع اختبار الإصلاح' 
AND p.created_by = auth.uid()
RETURNING amount, description, 'معاملة دخل تم إنشاؤها بنجاح' as status;

-- إنشاء معاملة مصروف
INSERT INTO transactions (type, amount, description, date, project_id, created_by)
SELECT 
    'expense',
    1500.00,
    'شراء مواد للمشروع',
    CURRENT_DATE,
    p.id,
    auth.uid()
FROM projects p
WHERE p.name = 'مشروع اختبار الإصلاح' 
AND p.created_by = auth.uid()
RETURNING amount, description, 'معاملة مصروف تم إنشاؤها بنجاح' as status;

-- ✅ 4. اختبار تحديث المبلغ المنفق تلقائياً
-- =========================================

-- التحقق من تحديث المبلغ المنفق في المشروع
SELECT 
    'اختبار التحديث التلقائي' as test_name,
    p.name as project_name,
    p.budget,
    p.spent,
    'المبلغ المنفق محدث تلقائياً' as result
FROM projects p
WHERE p.name = 'مشروع اختبار الإصلاح' 
AND p.created_by = auth.uid()
AND p.spent > 0;

-- ✅ 5. اختبار عرض المعاملات
-- ==========================

-- عرض جميع المعاملات للمستخدم
SELECT 
    'اختبار عرض المعاملات' as test_name,
    t.type,
    t.amount,
    t.description,
    p.name as project_name,
    'المعاملات ظاهرة بنجاح' as result
FROM transactions t
JOIN projects p ON p.id = t.project_id
WHERE t.created_by = auth.uid()
ORDER BY t.created_at DESC;

-- ✅ 6. اختبار إضافة موظف للمشروع
-- ===============================

-- إضافة موظف للمشروع
INSERT INTO employees (name, salary, assigned_project_id, created_by)
SELECT 
    'أحمد محمد - مهندس',
    3000.00,
    p.id,
    auth.uid()
FROM projects p
WHERE p.name = 'مشروع اختبار الإصلاح' 
AND p.created_by = auth.uid()
RETURNING name, salary, 'موظف تم إضافته بنجاح' as status;

-- ✅ 7. اختبار إضافة مستخدم آخر للمشروع
-- ====================================

-- محاولة إضافة مستخدم آخر كعضو في المشروع (سيعمل فقط إذا كان هناك مستخدم آخر)
-- هذا الاختبار اختياري ويحتاج معرف مستخدم آخر

-- INSERT INTO user_roles (user_id, project_id, role)
-- SELECT 
--     'USER_ID_HERE',  -- ضع معرف مستخدم آخر هنا
--     p.id,
--     'viewer'
-- FROM projects p
-- WHERE p.name = 'مشروع اختبار الإصلاح' 
-- AND p.created_by = auth.uid();

-- ✅ 8. ملخص اختبار الإصلاحات
-- ===========================

SELECT 
    'ملخص اختبار الإصلاحات' as test_summary,
    (SELECT COUNT(*) FROM projects WHERE name = 'مشروع اختبار الإصلاح') as projects_created,
    (SELECT COUNT(*) FROM user_roles ur JOIN projects p ON p.id = ur.project_id 
     WHERE p.name = 'مشروع اختبار الإصلاح' AND ur.role = 'owner') as owners_added,
    (SELECT COUNT(*) FROM transactions t JOIN projects p ON p.id = t.project_id 
     WHERE p.name = 'مشروع اختبار الإصلاح') as transactions_created,
    (SELECT COUNT(*) FROM employees e JOIN projects p ON p.id = e.assigned_project_id 
     WHERE p.name = 'مشروع اختبار الإصلاح') as employees_added,
    CASE 
        WHEN (SELECT spent FROM projects WHERE name = 'مشروع اختبار الإصلاح') > 0 
        THEN 'تم تحديث المبلغ المنفق' 
        ELSE 'لم يتم تحديث المبلغ المنفق' 
    END as auto_update_status;

-- ✅ 9. تنظيف بيانات الاختبار (اختياري)
-- ====================================

-- حذف بيانات الاختبار (قم بإلغاء التعليق إذا كنت تريد تنظيف البيانات)
/*
DELETE FROM transactions WHERE project_id IN (
    SELECT id FROM projects WHERE name = 'مشروع اختبار الإصلاح'
);

DELETE FROM employees WHERE assigned_project_id IN (
    SELECT id FROM projects WHERE name = 'مشروع اختبار الإصلاح'
);

DELETE FROM user_roles WHERE project_id IN (
    SELECT id FROM projects WHERE name = 'مشروع اختبار الإصلاح'
);

DELETE FROM projects WHERE name = 'مشروع اختبار الإصلاح';
*/
