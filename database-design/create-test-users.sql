-- 🔐 إنشاء حسابات تجريبية للنظام
-- ========================================

-- 1. إنشاء المدير العام
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "المدير العام"}',
  false,
  'authenticated'
);

-- 2. إنشاء مدير مشاريع
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'manager@example.com',
  crypt('manager123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "مدير المشاريع"}',
  false,
  'authenticated'
);

-- 3. إنشاء مستخدم عادي
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'user@example.com',
  crypt('user123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "مستخدم عادي"}',
  false,
  'authenticated'
);

-- 4. إنشاء ملفات شخصية مقابلة
INSERT INTO profiles (id, full_name, role)
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'admin@example.com' THEN 'المدير العام'
    WHEN u.email = 'manager@example.com' THEN 'مدير المشاريع'
    WHEN u.email = 'user@example.com' THEN 'مستخدم عادي'
  END,
  CASE 
    WHEN u.email = 'admin@example.com' THEN 'admin'
    WHEN u.email = 'manager@example.com' THEN 'manager'
    WHEN u.email = 'user@example.com' THEN 'user'
  END
FROM auth.users u
WHERE u.email IN ('admin@example.com', 'manager@example.com', 'user@example.com')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- 5. التحقق من إنشاء الحسابات
SELECT 
  'تم إنشاء الحسابات التجريبية' as status,
  count(*) as total_users
FROM auth.users 
WHERE email IN ('admin@example.com', 'manager@example.com', 'user@example.com');
