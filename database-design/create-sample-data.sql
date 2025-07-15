-- 📊 إنشاء بيانات تجريبية للنظام
-- ====================================

-- 1. إنشاء مشاريع تجريبية
INSERT INTO projects (name, description, budget, created_by) VALUES 
('مشروع الإسكان الاجتماعي', 'مشروع لبناء 100 وحدة سكنية', 5000000.00, (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)),
('مشروع الطريق الدائري', 'إنشاء طريق دائري للمدينة', 8000000.00, (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)),
('مشروع المجمع التجاري', 'بناء مجمع تجاري متكامل', 3000000.00, (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1));

-- 2. إنشاء موظفين تجريبيين
INSERT INTO employees (name, position, salary, assigned_project_id, created_by, is_active) VALUES 
('أحمد محمد المهندس', 'مهندس مدني', 8000.00, (SELECT id FROM projects WHERE name = 'مشروع الإسكان الاجتماعي' LIMIT 1), (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1), true),
('فاطمة أحمد', 'مهندسة معمارية', 7500.00, (SELECT id FROM projects WHERE name = 'مشروع الإسكان الاجتماعي' LIMIT 1), (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1), true),
('محمد علي', 'فني كهرباء', 4500.00, (SELECT id FROM projects WHERE name = 'مشروع الطريق الدائري' LIMIT 1), (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1), true),
('سارة حسن', 'محاسبة', 5000.00, (SELECT id FROM projects WHERE name = 'مشروع المجمع التجاري' LIMIT 1), (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1), true);

-- 3. إنشاء معاملات مالية تجريبية
INSERT INTO transactions (type, amount, description, date, project_id, created_by) VALUES 
-- معاملات مشروع الإسكان
('income', 1000000.00, 'دفعة أولى من العميل', '2025-01-01', (SELECT id FROM projects WHERE name = 'مشروع الإسكان الاجتماعي' LIMIT 1), (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)),
('expense', 250000.00, 'شراء مواد البناء الأساسية', '2025-01-05', (SELECT id FROM projects WHERE name = 'مشروع الإسكان الاجتماعي' LIMIT 1), (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)),
('expense', 80000.00, 'رواتب الموظفين - يناير', '2025-01-31', (SELECT id FROM projects WHERE name = 'مشروع الإسكان الاجتماعي' LIMIT 1), (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)),

-- معاملات مشروع الطريق الدائري
('income', 1500000.00, 'دفعة أولى من الحكومة', '2025-01-15', (SELECT id FROM projects WHERE name = 'مشروع الطريق الدائري' LIMIT 1), (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)),
('expense', 400000.00, 'شراء معدات ثقيلة', '2025-01-20', (SELECT id FROM projects WHERE name = 'مشروع الطريق الدائري' LIMIT 1), (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)),
('expense', 150000.00, 'وقود ومواد تشغيل', '2025-02-01', (SELECT id FROM projects WHERE name = 'مشروع الطريق الدائري' LIMIT 1), (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)),

-- معاملات مشروع المجمع التجاري
('income', 800000.00, 'دفعة أولى من المستثمر', '2025-02-01', (SELECT id FROM projects WHERE name = 'مشروع المجمع التجاري' LIMIT 1), (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)),
('expense', 120000.00, 'تصاريح ورسوم حكومية', '2025-02-05', (SELECT id FROM projects WHERE name = 'مشروع المجمع التجاري' LIMIT 1), (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)),
('expense', 180000.00, 'أعمال التصميم والهندسة', '2025-02-10', (SELECT id FROM projects WHERE name = 'مشروع المجمع التجاري' LIMIT 1), (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1));

-- 4. إنشاء مستحقات تجريبية
INSERT INTO receivables (beneficiary_name, amount, description, created_by) VALUES 
('مقاولة الأساسات المحدودة', 350000.00, 'أعمال الحفر والأساسات', (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)),
('شركة الكهرباء والميكانيكا', 180000.00, 'تمديدات كهربائية وميكانيكية', (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)),
('مؤسسة النقل والخدمات', 95000.00, 'نقل مواد ومعدات', (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1));

-- 5. إنشاء دفعات للمستحقات
INSERT INTO receivable_payments (receivable_id, amount, payment_date, created_by) VALUES 
((SELECT id FROM receivables WHERE beneficiary_name = 'مقاولة الأساسات المحدودة' LIMIT 1), 100000.00, '2025-01-15', (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)),
((SELECT id FROM receivables WHERE beneficiary_name = 'مقاولة الأساسات المحدودة' LIMIT 1), 150000.00, '2025-02-01', (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)),
((SELECT id FROM receivables WHERE beneficiary_name = 'شركة الكهرباء والميكانيكا' LIMIT 1), 80000.00, '2025-02-10', (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1));

-- 6. ربط المستخدمين بالمشاريع
INSERT INTO user_roles (user_id, project_id, role) VALUES 
-- ربط مدير المشاريع بالمشاريع
((SELECT id FROM auth.users WHERE email = 'manager@example.com' LIMIT 1), (SELECT id FROM projects WHERE name = 'مشروع الإسكان الاجتماعي' LIMIT 1), 'assigned'),
((SELECT id FROM auth.users WHERE email = 'manager@example.com' LIMIT 1), (SELECT id FROM projects WHERE name = 'مشروع الطريق الدائري' LIMIT 1), 'assigned'),

-- ربط المستخدم العادي بمشروع واحد
((SELECT id FROM auth.users WHERE email = 'user@example.com' LIMIT 1), (SELECT id FROM projects WHERE name = 'مشروع المجمع التجاري' LIMIT 1), 'assigned');

-- 7. التحقق من البيانات المُنشأة
SELECT 
  'تم إنشاء البيانات التجريبية بنجاح' as status,
  (SELECT COUNT(*) FROM projects) as projects_count,
  (SELECT COUNT(*) FROM employees) as employees_count,
  (SELECT COUNT(*) FROM transactions) as transactions_count,
  (SELECT COUNT(*) FROM receivables) as receivables_count,
  (SELECT COUNT(*) FROM user_roles) as user_assignments_count;
