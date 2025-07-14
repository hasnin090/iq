-- ===================================================================
-- دليل إدارة المستخدمين - نظام المحاسبة العربي
-- User Management Guide - Arabic Accounting System
-- ===================================================================

-- ===================================================================
-- 1. إضافة مستخدم جديد
-- ===================================================================

-- إضافة مستخدم عادي
INSERT INTO users (
    email, 
    password_hash, 
    full_name, 
    role, 
    phone, 
    is_active
) VALUES (
    'newuser@company.com',
    '$2b$12$example_hashed_password_here', -- يجب تشفير كلمة المرور
    'محمد أحمد الجديد',
    'user',
    '+964771234999',
    true
);

-- إضافة محاسب
INSERT INTO users (
    email, 
    password_hash, 
    full_name, 
    role, 
    phone, 
    is_active,
    email_verified
) VALUES (
    'accountant2@company.com',
    '$2b$12$another_hashed_password',
    'فاطمة سالم المحاسبة',
    'accountant',
    '+964771234888',
    true,
    true
);

-- إضافة مدير مشروع
INSERT INTO users (
    email, 
    password_hash, 
    full_name, 
    role, 
    phone, 
    is_active
) VALUES (
    'manager2@company.com',
    '$2b$12$manager_hashed_password',
    'علي حسن المدير',
    'manager',
    '+964771234777',
    true
);

-- ===================================================================
-- 2. تحديث معلومات المستخدمين
-- ===================================================================

-- تحديث اسم المستخدم ورقم الهاتف
UPDATE users 
SET 
    full_name = 'محمد أحمد العلي المحدث',
    phone = '+964771234555',
    updated_at = NOW()
WHERE email = 'newuser@company.com';

-- تغيير دور المستخدم (ترقية إلى محاسب)
UPDATE users 
SET 
    role = 'accountant',
    updated_at = NOW()
WHERE id = 4;

-- تحديث كلمة المرور (مع التشفير)
UPDATE users 
SET 
    password_hash = '$2b$12$new_hashed_password_here',
    updated_at = NOW()
WHERE email = 'user@company.com';

-- تفعيل/إلغاء تفعيل المستخدم
UPDATE users 
SET 
    is_active = false,
    updated_at = NOW()
WHERE email = 'olduser@company.com';

-- تحديث تاريخ آخر تسجيل دخول
UPDATE users 
SET 
    last_login = NOW(),
    updated_at = NOW()
WHERE id = 1;

-- تأكيد البريد الإلكتروني
UPDATE users 
SET 
    email_verified = true,
    updated_at = NOW()
WHERE email = 'newuser@company.com';

-- ===================================================================
-- 3. إدارة إعادة تعيين كلمة المرور
-- ===================================================================

-- إنشاء رمز إعادة تعيين كلمة المرور
UPDATE users 
SET 
    reset_token = 'random_secure_token_here',
    reset_token_expires = NOW() + INTERVAL '1 hour',
    updated_at = NOW()
WHERE email = 'user@company.com';

-- إعادة تعيين كلمة المرور باستخدام الرمز
UPDATE users 
SET 
    password_hash = '$2b$12$new_password_hash',
    reset_token = NULL,
    reset_token_expires = NULL,
    updated_at = NOW()
WHERE reset_token = 'random_secure_token_here' 
    AND reset_token_expires > NOW();

-- ===================================================================
-- 4. استعلامات مفيدة لإدارة المستخدمين
-- ===================================================================

-- عرض جميع المستخدمين مع معلوماتهم
SELECT 
    id,
    email,
    full_name,
    role,
    phone,
    is_active,
    email_verified,
    last_login,
    created_at
FROM users 
ORDER BY created_at DESC;

-- البحث عن مستخدم بالاسم أو البريد الإلكتروني
SELECT 
    id,
    email,
    full_name,
    role,
    is_active
FROM users 
WHERE 
    full_name ILIKE '%محمد%' 
    OR email ILIKE '%ahmed%'
ORDER BY full_name;

-- عرض المستخدمين النشطين فقط
SELECT 
    id,
    email,
    full_name,
    role,
    last_login
FROM users 
WHERE is_active = true
ORDER BY last_login DESC NULLS LAST;

-- إحصائيات المستخدمين حسب الدور
SELECT 
    role as الدور,
    COUNT(*) as العدد,
    COUNT(CASE WHEN is_active = true THEN 1 END) as النشطين,
    COUNT(CASE WHEN email_verified = true THEN 1 END) as المؤكدين
FROM users 
GROUP BY role
ORDER BY العدد DESC;

-- المستخدمين الذين لم يسجلوا دخول مؤخراً
SELECT 
    id,
    email,
    full_name,
    role,
    COALESCE(last_login, created_at) as آخر_نشاط,
    CASE 
        WHEN last_login IS NULL THEN 'لم يسجل دخول أبداً'
        WHEN last_login < NOW() - INTERVAL '30 days' THEN 'غير نشط'
        WHEN last_login < NOW() - INTERVAL '7 days' THEN 'نشاط قليل'
        ELSE 'نشط'
    END as حالة_النشاط
FROM users 
WHERE is_active = true
ORDER BY COALESCE(last_login, created_at) ASC;

-- ===================================================================
-- 5. حذف المستخدمين (استخدم بحذر!)
-- ===================================================================

-- إلغاء تفعيل بدلاً من الحذف (الأسلوب المفضل)
UPDATE users 
SET 
    is_active = false,
    updated_at = NOW()
WHERE email = 'user_to_delete@company.com';

-- الحذف النهائي (تأكد من عدم وجود بيانات مرتبطة)
-- تحقق أولاً من البيانات المرتبطة
SELECT 
    'transactions' as table_name, COUNT(*) as count
FROM transactions WHERE created_by = 5
UNION ALL
SELECT 'projects', COUNT(*) FROM projects WHERE created_by = 5
UNION ALL
SELECT 'documents', COUNT(*) FROM documents WHERE uploaded_by = 5
UNION ALL
SELECT 'activity_logs', COUNT(*) FROM activity_logs WHERE user_id = 5;

-- إذا لم توجد بيانات مرتبطة، يمكن الحذف
DELETE FROM users WHERE id = 5 AND id NOT IN (
    SELECT DISTINCT created_by FROM transactions WHERE created_by IS NOT NULL
    UNION
    SELECT DISTINCT created_by FROM projects WHERE created_by IS NOT NULL
    UNION
    SELECT DISTINCT uploaded_by FROM documents WHERE uploaded_by IS NOT NULL
);

-- ===================================================================
-- 6. التحقق من الصلاحيات
-- ===================================================================

-- التحقق من دور المستخدم
SELECT 
    id,
    email,
    full_name,
    role,
    CASE role
        WHEN 'admin' THEN 'يمكنه عمل كل شيء'
        WHEN 'manager' THEN 'يمكنه إدارة المشاريع والتقارير'
        WHEN 'accountant' THEN 'يمكنه إدارة المعاملات المالية'
        WHEN 'user' THEN 'عرض محدود فقط'
        ELSE 'غير محدد'
    END as الصلاحيات
FROM users 
WHERE email = 'user@company.com';

-- عرض المستخدمين حسب مستوى الصلاحية
SELECT 
    role,
    COUNT(*) as العدد,
    string_agg(full_name, ', ') as الأسماء
FROM users 
WHERE is_active = true
GROUP BY role
ORDER BY 
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'manager' THEN 2
        WHEN 'accountant' THEN 3
        WHEN 'user' THEN 4
        ELSE 5
    END;

-- ===================================================================
-- 7. تسجيل الأنشطة عند إدارة المستخدمين
-- ===================================================================

-- إضافة سجل نشاط عند إنشاء مستخدم جديد
INSERT INTO activity_logs (
    user_id, 
    action, 
    entity_type, 
    entity_id, 
    description,
    ip_address
) VALUES (
    1, -- المدير الذي أضاف المستخدم
    'create',
    'user',
    (SELECT id FROM users WHERE email = 'newuser@company.com'),
    'إضافة مستخدم جديد: محمد أحمد الجديد',
    '192.168.1.100'
);

-- إضافة سجل عند تحديث المستخدم
INSERT INTO activity_logs (
    user_id, 
    action, 
    entity_type, 
    entity_id, 
    description
) VALUES (
    1,
    'update',
    'user',
    4,
    'تحديث دور المستخدم إلى محاسب'
);

-- ===================================================================
-- 8. دوال مساعدة لإدارة المستخدمين
-- ===================================================================

-- دالة للتحقق من صحة البريد الإلكتروني
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- دالة للتحقق من قوة كلمة المرور
CREATE OR REPLACE FUNCTION is_strong_password(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- كلمة المرور يجب أن تكون 8 أحرف على الأقل
    -- وتحتوي على أرقام وحروف
    RETURN length(password) >= 8 
        AND password ~ '[0-9]' 
        AND password ~ '[A-Za-z]';
END;
$$ LANGUAGE plpgsql;

-- دالة لإنشاء اسم مستخدم فريد
CREATE OR REPLACE FUNCTION generate_unique_username(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
    counter INTEGER := 1;
    new_username TEXT;
BEGIN
    new_username := lower(replace(base_name, ' ', '.'));
    
    WHILE EXISTS (SELECT 1 FROM users WHERE email LIKE new_username || '%') LOOP
        new_username := lower(replace(base_name, ' ', '.')) || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN new_username || '@company.com';
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 9. أمثلة استخدام الدوال
-- ===================================================================

-- اختبار صحة البريد الإلكتروني
SELECT is_valid_email('test@example.com'); -- true
SELECT is_valid_email('invalid-email'); -- false

-- اختبار قوة كلمة المرور
SELECT is_strong_password('password123'); -- true
SELECT is_strong_password('weak'); -- false

-- إنشاء بريد إلكتروني فريد
SELECT generate_unique_username('أحمد محمد'); -- ahmed.mohammed@company.com

-- ===================================================================
-- 10. استعلامات للتقارير الإدارية
-- ===================================================================

-- تقرير نشاط المستخدمين الشهري
SELECT 
    u.full_name,
    u.role,
    COUNT(al.id) as عدد_الأنشطة,
    MAX(al.created_at) as آخر_نشاط
FROM users u
LEFT JOIN activity_logs al ON u.id = al.user_id 
    AND al.created_at >= DATE_TRUNC('month', CURRENT_DATE)
WHERE u.is_active = true
GROUP BY u.id, u.full_name, u.role
ORDER BY عدد_الأنشطة DESC;

-- تقرير تسجيل الدخول
SELECT 
    full_name,
    email,
    last_login,
    CASE 
        WHEN last_login IS NULL THEN 'لم يسجل دخول'
        WHEN last_login >= CURRENT_DATE THEN 'اليوم'
        WHEN last_login >= CURRENT_DATE - INTERVAL '7 days' THEN 'هذا الأسبوع'
        WHEN last_login >= CURRENT_DATE - INTERVAL '30 days' THEN 'هذا الشهر'
        ELSE 'أكثر من شهر'
    END as آخر_تسجيل_دخول
FROM users 
WHERE is_active = true
ORDER BY last_login DESC NULLS LAST;

-- إحصائيات شاملة للمستخدمين
SELECT 
    'إجمالي المستخدمين' as المؤشر,
    COUNT(*)::text as القيمة
FROM users
UNION ALL
SELECT 'المستخدمين النشطين', COUNT(*)::text 
FROM users WHERE is_active = true
UNION ALL
SELECT 'المديرين', COUNT(*)::text 
FROM users WHERE role = 'admin' AND is_active = true
UNION ALL
SELECT 'المحاسبين', COUNT(*)::text 
FROM users WHERE role = 'accountant' AND is_active = true
UNION ALL
SELECT 'مديري المشاريع', COUNT(*)::text 
FROM users WHERE role = 'manager' AND is_active = true
UNION ALL
SELECT 'البريد مؤكد', COUNT(*)::text 
FROM users WHERE email_verified = true
UNION ALL
SELECT 'سجلوا دخول اليوم', COUNT(*)::text 
FROM users WHERE last_login >= CURRENT_DATE;

-- ===================================================================
-- نهاية دليل إدارة المستخدمين
-- ===================================================================
