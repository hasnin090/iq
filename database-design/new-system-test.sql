-- 🔐 اختبار النظام الجديد: مدير + مستخدمين مرتبطين بمشاريع
-- ============================================================

-- ✅ 1. اختبار إنشاء مستخدم مدير
-- ===============================

-- إنشاء ملف شخصي للمدير (يجب تشغيله بواسطة المدير)
INSERT INTO profiles (id, full_name, role) 
VALUES (auth.uid(), 'المدير العام', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'المدير العام';

-- التحقق من دور المدير
SELECT 'فحص دور المدير' as test_name, role, full_name 
FROM profiles WHERE id = auth.uid();

-- ✅ 2. اختبار المدير - إنشاء مشروع
-- ===================================

-- المدير ينشئ مشروع جديد
INSERT INTO projects (name, description, budget, created_by) 
VALUES ('مشروع اختبار النظام الجديد', 'اختبار صلاحيات المدير والمستخدمين', 150000.00, auth.uid())
RETURNING id, name, 'مشروع تم إنشاؤه بواسطة المدير' as status;

-- ✅ 3. اختبار المدير - إنشاء معاملات
-- ====================================

-- المدير ينشئ معاملة دخل
INSERT INTO transactions (type, amount, description, date, project_id, created_by)
SELECT 
    'income',
    50000.00,
    'دفعة أولى من العميل',
    CURRENT_DATE,
    p.id,
    auth.uid()
FROM projects p
WHERE p.name = 'مشروع اختبار النظام الجديد'
RETURNING amount, description, 'معاملة دخل من المدير' as status;

-- المدير ينشئ معاملة مصروف
INSERT INTO transactions (type, amount, description, date, project_id, created_by)
SELECT 
    'expense',
    15000.00,
    'شراء مواد أولية',
    CURRENT_DATE,
    p.id,
    auth.uid()
FROM projects p
WHERE p.name = 'مشروع اختبار النظام الجديد'
RETURNING amount, description, 'معاملة مصروف من المدير' as status;

-- ✅ 4. اختبار المدير - إنشاء موظف
-- ==================================

-- المدير ينشئ موظف
INSERT INTO employees (name, salary, assigned_project_id, created_by)
SELECT 
    'أحمد المهندس',
    4000.00,
    p.id,
    auth.uid()
FROM projects p
WHERE p.name = 'مشروع اختبار النظام الجديد'
RETURNING name, salary, 'موظف تم إنشاؤه بواسطة المدير' as status;

-- ✅ 5. محاكاة مستخدم عادي
-- =========================

-- ملاحظة: هذا الجزء يحتاج تنفيذ بواسطة مستخدم عادي (ليس المدير)
-- يمكن تنفيذه في جلسة منفصلة

/*
-- إنشاء ملف شخصي للمستخدم العادي
INSERT INTO profiles (id, full_name, role) 
VALUES (auth.uid(), 'مستخدم تجريبي', 'user')
ON CONFLICT (id) DO UPDATE SET role = 'user', full_name = 'مستخدم تجريبي';

-- المدير يربط المستخدم بالمشروع
INSERT INTO user_roles (user_id, project_id, role)
SELECT 
    'USER_ID_HERE',  -- ضع معرف المستخدم هنا
    p.id,
    'assigned'
FROM projects p
WHERE p.name = 'مشروع اختبار النظام الجديد';
*/

-- ✅ 6. اختبار عرض البيانات للمدير
-- ==================================

-- المدير يرى جميع المشاريع
SELECT 
    'المدير - عرض المشاريع' as test_name,
    COUNT(*) as total_projects,
    'المدير يرى جميع المشاريع' as result
FROM projects;

-- المدير يرى جميع المعاملات
SELECT 
    'المدير - عرض المعاملات' as test_name,
    COUNT(*) as total_transactions,
    'المدير يرى جميع المعاملات' as result
FROM transactions;

-- المدير يرى جميع الموظفين
SELECT 
    'المدير - عرض الموظفين' as test_name,
    COUNT(*) as total_employees,
    'المدير يرى جميع الموظفين' as result
FROM employees;

-- المدير يرى جميع المستخدمين
SELECT 
    'المدير - عرض المستخدمين' as test_name,
    COUNT(*) as total_users,
    'المدير يرى جميع المستخدمين' as result
FROM profiles;

-- المدير يرى جميع أدوار المستخدمين
SELECT 
    'المدير - عرض الأدوار' as test_name,
    COUNT(*) as total_roles,
    'المدير يرى جميع الأدوار' as result
FROM user_roles;

-- ✅ 7. اختبار إدارة أدوار المستخدمين
-- ====================================

-- المدير يضيف مستخدم جديد للمشروع (مثال)
/*
INSERT INTO user_roles (user_id, project_id, role)
SELECT 
    'NEW_USER_ID',  -- معرف مستخدم جديد
    p.id,
    'assigned'
FROM projects p
WHERE p.name = 'مشروع اختبار النظام الجديد';
*/

-- عرض المستخدمين المرتبطين بالمشروع
SELECT 
    'المستخدمين في المشروع' as info,
    p.name as project_name,
    pr.full_name as user_name,
    ur.role as user_role
FROM projects p
JOIN user_roles ur ON ur.project_id = p.id
JOIN profiles pr ON pr.id = ur.user_id
WHERE p.name = 'مشروع اختبار النظام الجديد';

-- ✅ 8. اختبار محدودية صلاحيات المستخدم العادي
-- ============================================

-- هذا الجزء للاختبار مع مستخدم عادي (سيفشل مع المدير)

-- محاولة إنشاء مشروع (يجب أن تفشل للمستخدم العادي)
/*
INSERT INTO projects (name, description, budget, created_by) 
VALUES ('مشروع غير مصرح', 'اختبار فشل الصلاحية', 50000.00, auth.uid());
-- يجب أن تفشل هذه العملية للمستخدم العادي
*/

-- محاولة إنشاء معاملة (يجب أن تفشل للمستخدم العادي)
/*
INSERT INTO transactions (type, amount, description, date, project_id, created_by)
VALUES ('income', 1000.00, 'محاولة غير مصرحة', CURRENT_DATE, 'PROJECT_ID', auth.uid());
-- يجب أن تفشل هذه العملية للمستخدم العادي
*/

-- ✅ 9. اختبار عرض البيانات للمستخدم العادي
-- ==========================================

-- المستخدم العادي يرى فقط مشاريعه المرتبطة
/*
SELECT 
    'المستخدم - المشاريع المرتبطة' as test_name,
    p.name,
    'المستخدم يرى مشاريعه فقط' as result
FROM projects p
JOIN user_roles ur ON ur.project_id = p.id
WHERE ur.user_id = auth.uid();
*/

-- المستخدم العادي يرى معاملات مشاريعه فقط
/*
SELECT 
    'المستخدم - معاملات مشاريعه' as test_name,
    t.type,
    t.amount,
    t.description,
    p.name as project_name
FROM transactions t
JOIN projects p ON p.id = t.project_id
JOIN user_roles ur ON ur.project_id = p.id
WHERE ur.user_id = auth.uid();
*/

-- ✅ 10. اختبار رفع المستندات للمستخدم
-- ====================================

-- المستخدم يرفع مستند لمشروعه
INSERT INTO documents (title, description, file_url, created_by)
VALUES ('تقرير مشروع', 'تقرير شهري للمشروع', '/uploads/report.pdf', auth.uid())
RETURNING title, 'مستند تم رفعه بنجاح' as status;

-- ✅ 11. اختبار المستحقات والدفعات
-- =================================

-- إنشاء مستحق
INSERT INTO receivables (beneficiary_name, amount, description, created_by)
VALUES ('مقاول البناء', 25000.00, 'مستحق أعمال البناء', auth.uid())
RETURNING beneficiary_name, amount, 'مستحق تم إنشاؤه' as status;

-- إضافة دفعة للمستحق
INSERT INTO receivable_payments (receivable_id, amount, payment_date, created_by)
SELECT r.id, 10000.00, CURRENT_DATE, auth.uid()
FROM receivables r 
WHERE r.beneficiary_name = 'مقاول البناء' AND r.created_by = auth.uid()
RETURNING amount, 'دفعة تم تسجيلها' as status;

-- ✅ 12. ملخص النظام الجديد
-- =========================

SELECT 
    'ملخص النظام الجديد' as summary,
    'المدير: يدير كل شيء' as admin_role,
    'المستخدم: يرى ويدخل بيانات مشاريعه فقط' as user_role,
    'المعاملات: قراءة فقط للمستخدمين' as transactions_access,
    'المستندات: يمكن للمستخدمين رفعها' as documents_access,
    'المستحقات: يمكن للمستخدمين إدارتها' as receivables_access;

-- عرض إحصائيات النظام
SELECT 
    'إحصائيات النظام' as stats,
    (SELECT COUNT(*) FROM projects) as total_projects,
    (SELECT COUNT(*) FROM transactions) as total_transactions,
    (SELECT COUNT(*) FROM employees) as total_employees,
    (SELECT COUNT(*) FROM documents) as total_documents,
    (SELECT COUNT(*) FROM receivables) as total_receivables,
    (SELECT COUNT(*) FROM user_roles) as total_user_assignments;
