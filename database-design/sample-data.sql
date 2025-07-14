-- ===================================================================
-- بيانات تجريبية شاملة - نظام المحاسبة العربي
-- Sample Data for Arabic Accounting System
-- ===================================================================

-- ===================================================================
-- 1. إنشاء مستخدمين تجريبيين
-- ===================================================================

INSERT INTO users (email, password_hash, full_name, role, phone, is_active) VALUES
('admin@company.com', '$2b$10$example_hash_for_admin', 'أحمد محمد الإداري', 'admin', '+964771234567', true),
('manager@company.com', '$2b$10$example_hash_for_manager', 'فاطمة أحمد المديرة', 'manager', '+964771234568', true),
('accountant@company.com', '$2b$10$example_hash_for_accountant', 'محمد علي المحاسب', 'accountant', '+964771234569', true),
('user@company.com', '$2b$10$example_hash_for_user', 'سارة خالد المستخدمة', 'user', '+964771234570', true);

-- ===================================================================
-- 2. إنشاء موظفين تجريبيين
-- ===================================================================

INSERT INTO employees (employee_code, full_name, email, phone, position, department, salary, hire_date, is_active) VALUES
('EMP001', 'علي حسن الطويل', 'ali.hassan@company.com', '+964771234571', 'مطور ويب أول', 'تقنية المعلومات', 1200.00, '2024-01-15', true),
('EMP002', 'زينب محمد الجميل', 'zainab.mohammed@company.com', '+964771234572', 'مصممة جرافيك', 'التصميم', 950.00, '2024-02-01', true),
('EMP003', 'حسام عبدالله النجار', 'hussam.abdullah@company.com', '+964771234573', 'محلل أعمال', 'الإدارة', 1100.00, '2024-01-20', true),
('EMP004', 'رنا أحمد الشامي', 'rana.ahmed@company.com', '+964771234574', 'محاسبة', 'المحاسبة', 1000.00, '2023-12-01', true),
('EMP005', 'يوسف محمود الكردي', 'youssef.mahmoud@company.com', '+964771234575', 'مطور تطبيقات', 'تقنية المعلومات', 1150.00, '2024-03-01', true);

-- ===================================================================
-- 3. إنشاء مشاريع تجريبية
-- ===================================================================

INSERT INTO projects (name, description, start_date, end_date, status, budget, client_name, client_email, priority, created_by) VALUES
('موقع شركة التجارة الإلكترونية', 'تطوير موقع إلكتروني متكامل لشركة التجارة الإلكترونية مع نظام إدارة المحتوى', '2024-01-01', '2024-06-30', 'active', 15000.00, 'شركة النور للتجارة', 'info@alnoor-trading.com', 'high', 1),
('تطبيق إدارة المطاعم', 'تطوير تطبيق محمول لإدارة المطاعم والطلبات', '2024-02-15', '2024-08-15', 'active', 12000.00, 'مطاعم الذوق الرفيع', 'orders@fine-dining.com', 'medium', 1),
('نظام إدارة المخازن', 'تطوير نظام شامل لإدارة المخازن والمخزون', '2024-03-01', '2024-09-01', 'active', 18000.00, 'شركة المستقبل للتوزيع', 'warehouse@future-dist.com', 'high', 2),
('موقع تعليمي تفاعلي', 'منصة تعليمية أونلاين للطلاب والمعلمين', '2023-11-01', '2024-05-01', 'completed', 8000.00, 'أكاديمية المعرفة', 'info@knowledge-academy.com', 'medium', 2),
('تطبيق الخدمات المصرفية', 'تطبيق محمول للخدمات المصرفية الإلكترونية', '2024-04-01', '2024-12-01', 'active', 25000.00, 'البنك الوطني العراقي', 'digital@national-bank.iq', 'urgent', 1);

-- ===================================================================
-- 4. ربط الموظفين بالمشاريع
-- ===================================================================

INSERT INTO employee_projects (employee_id, project_id, role, hourly_rate, start_date, is_active) VALUES
(1, 1, 'مطور رئيسي', 15.00, '2024-01-01', true),
(2, 1, 'مصمم واجهات', 12.00, '2024-01-15', true),
(1, 2, 'مطور تطبيقات', 15.00, '2024-02-15', true),
(3, 2, 'محلل متطلبات', 13.00, '2024-02-15', true),
(5, 3, 'مطور backend', 14.00, '2024-03-01', true),
(1, 4, 'مطور رئيسي', 15.00, '2023-11-01', false),
(2, 4, 'مصمم UI/UX', 12.00, '2023-11-01', false),
(1, 5, 'مطور أول', 16.00, '2024-04-01', true),
(5, 5, 'مطور مساعد', 14.00, '2024-04-01', true);

-- ===================================================================
-- 5. إنشاء معاملات مالية متنوعة
-- ===================================================================

-- معاملات شهر يناير 2024
INSERT INTO transactions (date, type, amount, description, expense_type_id, project_id, created_by, payment_method, status) VALUES
-- الدخل
('2024-01-05', 'income', 5000.00, 'دفعة أولى من مشروع موقع التجارة الإلكترونية', NULL, 1, 1, 'bank_transfer', 'completed'),
('2024-01-10', 'income', 3000.00, 'دفعة أولى من مشروع المطعم', NULL, 2, 1, 'bank_transfer', 'completed'),
('2024-01-15', 'income', 2000.00, 'استشارة تقنية خارجية', NULL, NULL, 2, 'cash', 'completed'),

-- المصاريف
('2024-01-01', 'expense', 1200.00, 'راتب علي حسن - يناير 2024', 2, NULL, 1, 'bank_transfer', 'completed'),
('2024-01-01', 'expense', 950.00, 'راتب زينب محمد - يناير 2024', 2, NULL, 1, 'bank_transfer', 'completed'),
('2024-01-01', 'expense', 1100.00, 'راتب حسام عبدالله - يناير 2024', 2, NULL, 1, 'bank_transfer', 'completed'),
('2024-01-01', 'expense', 1000.00, 'راتب رنا أحمد - يناير 2024', 2, NULL, 1, 'bank_transfer', 'completed'),
('2024-01-05', 'expense', 800.00, 'إيجار المكتب - يناير 2024', 3, NULL, 1, 'bank_transfer', 'completed'),
('2024-01-10', 'expense', 150.00, 'فاتورة الكهرباء - يناير 2024', 6, NULL, 4, 'bank_transfer', 'completed'),
('2024-01-12', 'expense', 80.00, 'فاتورة الإنترنت - يناير 2024', 5, NULL, 4, 'bank_transfer', 'completed'),
('2024-01-15', 'expense', 200.00, 'مستلزمات مكتبية ومواد تطوير', 8, 1, 3, 'cash', 'completed'),
('2024-01-20', 'expense', 300.00, 'تكاليف استضافة وخوادم', 1, 1, 1, 'credit_card', 'completed'),
('2024-01-25', 'expense', 120.00, 'وقود ومواصلات', 4, NULL, 2, 'cash', 'completed');

-- معاملات شهر فبراير 2024
INSERT INTO transactions (date, type, amount, description, expense_type_id, project_id, created_by, payment_method, status) VALUES
-- الدخل
('2024-02-01', 'income', 4000.00, 'دفعة ثانية من مشروع موقع التجارة الإلكترونية', NULL, 1, 1, 'bank_transfer', 'completed'),
('2024-02-15', 'income', 6000.00, 'دفعة أولى من مشروع إدارة المخازن', NULL, 3, 2, 'bank_transfer', 'completed'),
('2024-02-20', 'income', 2500.00, 'دفعة ثانية من مشروع المطعم', NULL, 2, 1, 'bank_transfer', 'completed'),

-- المصاريف (رواتب فبراير)
('2024-02-01', 'expense', 1200.00, 'راتب علي حسن - فبراير 2024', 2, NULL, 1, 'bank_transfer', 'completed'),
('2024-02-01', 'expense', 950.00, 'راتب زينب محمد - فبراير 2024', 2, NULL, 1, 'bank_transfer', 'completed'),
('2024-02-01', 'expense', 1100.00, 'راتب حسام عبدالله - فبراير 2024', 2, NULL, 1, 'bank_transfer', 'completed'),
('2024-02-01', 'expense', 1000.00, 'راتب رنا أحمد - فبراير 2024', 2, NULL, 1, 'bank_transfer', 'completed'),
('2024-02-05', 'expense', 800.00, 'إيجار المكتب - فبراير 2024', 3, NULL, 1, 'bank_transfer', 'completed'),
('2024-02-10', 'expense', 165.00, 'فاتورة الكهرباء - فبراير 2024', 6, NULL, 4, 'bank_transfer', 'completed'),
('2024-02-12', 'expense', 80.00, 'فاتورة الإنترنت - فبراير 2024', 5, NULL, 4, 'bank_transfer', 'completed'),
('2024-02-18', 'expense', 450.00, 'شراء أجهزة كمبيوتر جديدة', 1, NULL, 2, 'bank_transfer', 'completed'),
('2024-02-22', 'expense', 180.00, 'تسويق رقمي وإعلانات', 10, 1, 2, 'credit_card', 'completed'),
('2024-02-28', 'expense', 90.00, 'صيانة أجهزة ومعدات', 9, NULL, 3, 'cash', 'completed');

-- معاملات شهر مارس 2024
INSERT INTO transactions (date, type, amount, description, expense_type_id, project_id, created_by, payment_method, status) VALUES
-- الدخل
('2024-03-01', 'income', 8000.00, 'دفعة ثالثة من مشروع موقع التجارة الإلكترونية', NULL, 1, 1, 'bank_transfer', 'completed'),
('2024-03-10', 'income', 12000.00, 'دفعة أولى من مشروع الخدمات المصرفية', NULL, 5, 1, 'bank_transfer', 'completed'),
('2024-03-15', 'income', 5000.00, 'دفعة ثانية من مشروع إدارة المخازن', NULL, 3, 2, 'bank_transfer', 'completed'),

-- راتب الموظف الجديد
('2024-03-01', 'expense', 1150.00, 'راتب يوسف محمود - مارس 2024', 2, NULL, 1, 'bank_transfer', 'completed'),
-- باقي الرواتب
('2024-03-01', 'expense', 1200.00, 'راتب علي حسن - مارس 2024', 2, NULL, 1, 'bank_transfer', 'completed'),
('2024-03-01', 'expense', 950.00, 'راتب زينب محمد - مارس 2024', 2, NULL, 1, 'bank_transfer', 'completed'),
('2024-03-01', 'expense', 1100.00, 'راتب حسام عبدالله - مارس 2024', 2, NULL, 1, 'bank_transfer', 'completed'),
('2024-03-01', 'expense', 1000.00, 'راتب رنا أحمد - مارس 2024', 2, NULL, 1, 'bank_transfer', 'completed'),
('2024-03-05', 'expense', 800.00, 'إيجار المكتب - مارس 2024', 3, NULL, 1, 'bank_transfer', 'completed'),
('2024-03-10', 'expense', 140.00, 'فاتورة الكهرباء - مارس 2024', 6, NULL, 4, 'bank_transfer', 'completed'),
('2024-03-12', 'expense', 80.00, 'فاتورة الإنترنت - مارس 2024', 5, NULL, 4, 'bank_transfer', 'completed'),
('2024-03-20', 'expense', 350.00, 'تراخيص برامج ومكتبات', 1, NULL, 1, 'credit_card', 'completed'),
('2024-03-25', 'expense', 500.00, 'تدريب الموظفين وتطوير المهارات', 1, NULL, 2, 'bank_transfer', 'completed');

-- ===================================================================
-- 6. إنشاء مدفوعات مؤجلة
-- ===================================================================

INSERT INTO deferred_payments (title, description, amount, due_date, status, priority, project_id, client_name, client_email, created_by) VALUES
('الدفعة النهائية - موقع التجارة الإلكترونية', 'الدفعة الأخيرة عند تسليم المشروع كاملاً', 6000.00, '2024-07-15', 'pending', 'high', 1, 'شركة النور للتجارة', 'info@alnoor-trading.com', 1),
('دفعة منتصف المشروع - تطبيق المطاعم', 'دفعة عند الانتهاء من 50% من العمل', 4500.00, '2024-05-15', 'pending', 'medium', 2, 'مطاعم الذوق الرفيع', 'orders@fine-dining.com', 1),
('الدفعة الثانية - نظام إدارة المخازن', 'دفعة بعد الانتهاء من التحليل والتصميم', 7000.00, '2024-05-01', 'pending', 'high', 3, 'شركة المستقبل للتوزيع', 'warehouse@future-dist.com', 2),
('الدفعة النهائية - نظام إدارة المخازن', 'الدفعة الأخيرة عند التسليم النهائي', 6000.00, '2024-09-15', 'pending', 'high', 3, 'شركة المستقبل للتوزيع', 'warehouse@future-dist.com', 2),
('دفعة التطوير الأولى - الخدمات المصرفية', 'دفعة بعد الانتهاء من مرحلة التطوير الأولى', 8000.00, '2024-07-01', 'pending', 'urgent', 5, 'البنك الوطني العراقي', 'digital@national-bank.iq', 1),
('الدفعة النهائية - الخدمات المصرفية', 'الدفعة الأخيرة عند تسليم النظام واختباره', 5000.00, '2024-12-15', 'pending', 'urgent', 5, 'البنك الوطني العراقي', 'digital@national-bank.iq', 1);

-- ===================================================================
-- 7. إنشاء أعمال مكتملة
-- ===================================================================

INSERT INTO completed_works (title, description, project_id, completed_by, hours_spent, estimated_hours, quality_rating, client_approval, status) VALUES
('تصميم واجهة المستخدم الرئيسية', 'تصميم وتطوير الصفحة الرئيسية وصفحات المنتجات للموقع التجاري', 1, 2, 45.5, 40.0, 5, true, 'approved'),
('تطوير نظام إدارة المستخدمين', 'تطوير نظام تسجيل الدخول وإدارة حسابات المستخدمين', 1, 1, 32.0, 35.0, 4, true, 'approved'),
('تطوير نظام الدفع الإلكتروني', 'تكامل بوابات الدفع الإلكتروني مع الموقع', 1, 1, 28.5, 30.0, 5, false, 'completed'),
('تصميم تطبيق الموبايل', 'تصميم واجهات تطبيق إدارة المطاعم للأجهزة المحمولة', 2, 2, 38.0, 35.0, 4, true, 'approved'),
('تطوير API الخدمات', 'تطوير واجهة برمجة التطبيقات للتطبيق', 2, 1, 42.0, 45.0, 4, true, 'approved'),
('منصة التعلم الإلكتروني - المرحلة النهائية', 'إكمال تطوير منصة التعلم وتسليمها للعميل', 4, 1, 120.0, 110.0, 5, true, 'approved');

-- ===================================================================
-- 8. إنشاء وثائق للأعمال المكتملة
-- ===================================================================

INSERT INTO completed_work_documents (work_id, title, description, file_url, file_name, file_type, uploaded_by) VALUES
(1, 'ملف التصميم النهائي', 'ملفات التصميم والمخططات للواجهة الرئيسية', 'https://storage.example.com/designs/main-ui-final.zip', 'main-ui-final.zip', 'application/zip', 2),
(1, 'دليل المستخدم للواجهة', 'دليل استخدام الواجهة للمستخدمين النهائيين', 'https://storage.example.com/docs/ui-user-guide.pdf', 'ui-user-guide.pdf', 'application/pdf', 2),
(2, 'توثيق نظام المستخدمين', 'الوثائق التقنية لنظام إدارة المستخدمين', 'https://storage.example.com/docs/user-management-docs.pdf', 'user-management-docs.pdf', 'application/pdf', 1),
(3, 'دليل تكامل بوابات الدفع', 'دليل فني لتكامل أنظمة الدفع الإلكتروني', 'https://storage.example.com/docs/payment-integration.pdf', 'payment-integration.pdf', 'application/pdf', 1),
(4, 'ملفات تصميم التطبيق', 'جميع ملفات التصميم للتطبيق المحمول', 'https://storage.example.com/designs/mobile-app-designs.zip', 'mobile-app-designs.zip', 'application/zip', 2),
(6, 'دليل المشروع الكامل', 'الدليل الشامل لمنصة التعلم الإلكتروني', 'https://storage.example.com/docs/elearning-complete-guide.pdf', 'elearning-complete-guide.pdf', 'application/pdf', 1);

-- ===================================================================
-- 9. إنشاء وثائق عامة
-- ===================================================================

INSERT INTO documents (title, description, file_url, file_name, file_type, category, project_id, uploaded_by, visibility) VALUES
('عقد مشروع التجارة الإلكترونية', 'العقد الموقع مع شركة النور للتجارة', 'https://storage.example.com/contracts/alnoor-contract.pdf', 'alnoor-contract.pdf', 'application/pdf', 'عقود', 1, 1, 'restricted'),
('مخططات قاعدة البيانات', 'مخططات قاعدة بيانات نظام إدارة المخازن', 'https://storage.example.com/docs/warehouse-db-schema.pdf', 'warehouse-db-schema.pdf', 'application/pdf', 'تقنية', 3, 1, 'private'),
('تصاريح العمل', 'تصاريح وتراخيص الشركة', 'https://storage.example.com/legal/work-permits.pdf', 'work-permits.pdf', 'application/pdf', 'قانونية', NULL, 1, 'restricted'),
('سياسة الخصوصية', 'سياسة الخصوصية للمشاريع التطويرية', 'https://storage.example.com/legal/privacy-policy.pdf', 'privacy-policy.pdf', 'application/pdf', 'قانونية', NULL, 2, 'public'),
('دليل الموظفين', 'دليل القوانين والإجراءات للموظفين', 'https://storage.example.com/hr/employee-handbook.pdf', 'employee-handbook.pdf', 'application/pdf', 'موارد بشرية', NULL, 2, 'restricted'),
('عرض المشروع المصرفي', 'العرض المقدم للبنك الوطني العراقي', 'https://storage.example.com/proposals/bank-proposal.pdf', 'bank-proposal.pdf', 'application/pdf', 'عروض', 5, 1, 'restricted');

-- ===================================================================
-- 10. إنشاء إشعارات
-- ===================================================================

INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id) VALUES
(1, 'دفعة جديدة مستلمة', 'تم استلام دفعة بقيمة 5000$ من مشروع التجارة الإلكترونية', 'success', 'transaction', 1),
(1, 'موعد دفعة مستحق', 'موعد استحقاق دفعة مشروع المطاعم خلال أسبوع', 'warning', 'payment', 2),
(2, 'مشروع جديد مُسند', 'تم تعيينك في مشروع نظام إدارة المخازن', 'info', 'project', 3),
(3, 'مهمة مكتملة', 'تم الانتهاء من تطوير نظام المستخدمين', 'success', 'work', 2),
(4, 'فاتورة جديدة', 'فاتورة كهرباء جديدة بحاجة للمراجعة', 'info', 'transaction', 10),
(1, 'تجاوز الميزانية', 'مشروع التجارة الإلكترونية تجاوز 80% من الميزانية', 'warning', 'project', 1),
(2, 'موافقة مطلوبة', 'عمل مكتمل بحاجة لموافقتك', 'info', 'work', 3),
(1, 'نسخة احتياطية مكتملة', 'تم إنشاء النسخة الاحتياطية الأسبوعية بنجاح', 'success', 'backup', 1);

-- ===================================================================
-- 11. إنشاء سجل أنشطة
-- ===================================================================

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address) VALUES
(1, 'create', 'project', 1, 'إنشاء مشروع موقع شركة التجارة الإلكترونية', '192.168.1.100'),
(1, 'create', 'transaction', 1, 'إضافة معاملة دخل - دفعة أولى من المشروع', '192.168.1.100'),
(2, 'create', 'project', 3, 'إنشاء مشروع نظام إدارة المخازن', '192.168.1.101'),
(1, 'update', 'project', 1, 'تحديث تفاصيل مشروع التجارة الإلكترونية', '192.168.1.100'),
(3, 'create', 'transaction', 10, 'إضافة فاتورة كهرباء - يناير 2024', '192.168.1.102'),
(2, 'create', 'completed_work', 1, 'إكمال عمل تصميم واجهة المستخدم الرئيسية', '192.168.1.101'),
(1, 'create', 'deferred_payment', 1, 'إضافة دفعة مؤجلة للمشروع التجاري', '192.168.1.100'),
(4, 'login', 'user', 4, 'تسجيل دخول المستخدم سارة خالد', '192.168.1.103'),
(2, 'create', 'document', 1, 'رفع عقد مشروع التجارة الإلكترونية', '192.168.1.101'),
(1, 'create', 'employee', 5, 'إضافة موظف جديد - يوسف محمود الكردي', '192.168.1.100');

-- ===================================================================
-- 12. إنشاء تتبع ميزانيات
-- ===================================================================

INSERT INTO budget_tracking (project_id, expense_type_id, period_start, period_end, planned_amount, actual_amount, status, created_by) VALUES
(1, 2, '2024-01-01', '2024-06-30', 3000.00, 2400.00, 'active', 1), -- رواتب مشروع التجارة الإلكترونية
(1, 1, '2024-01-01', '2024-06-30', 2000.00, 850.00, 'active', 1), -- مصاريف عامة مشروع التجارة
(2, 2, '2024-02-15', '2024-08-15', 2500.00, 1200.00, 'active', 1), -- رواتب مشروع المطاعم
(3, 2, '2024-03-01', '2024-09-01', 4000.00, 1150.00, 'active', 2), -- رواتب مشروع المخازن
(5, 2, '2024-04-01', '2024-12-01', 6000.00, 0.00, 'active', 1); -- رواتب المشروع المصرفي

-- ===================================================================
-- 13. إنشاء رسائل واتساب تجريبية
-- ===================================================================

INSERT INTO whatsapp_messages (phone_number, message_text, message_type, entity_type, entity_id, status, sent_by) VALUES
('+964771234567', 'تذكير: موعد استحقاق دفعة مشروع المطاعم خلال 7 أيام', 'reminder', 'payment', 2, 'delivered', 1),
('+964771234568', 'تم الانتهاء من تصميم واجهة المستخدم الرئيسية لمشروعكم', 'notification', 'work', 1, 'delivered', 2),
('+964771234569', 'فاتورة جديدة تحتاج للمراجعة والموافقة', 'notification', 'transaction', 15, 'sent', 1),
('+964771234570', 'مرحباً، تم تعيينك في مشروع نظام إدارة المخازن الجديد', 'notification', 'project', 3, 'delivered', 2);

-- ===================================================================
-- 14. إنشاء نسخ احتياطية تجريبية
-- ===================================================================

INSERT INTO backups (name, description, backup_type, file_path, file_size, status, completed_at, created_by, tables_included, records_count) VALUES
('نسخة احتياطية أسبوعية - مارس 2024', 'النسخة الاحتياطية الأسبوعية للبيانات', 'full', '/backups/weekly-backup-2024-03-25.sql', 1048576, 'completed', '2024-03-25 02:30:00+00', 1, ARRAY['users','projects','transactions','documents'], 450),
('نسخة احتياطية يومية - مارس 26', 'النسخة الاحتياطية اليومية', 'incremental', '/backups/daily-backup-2024-03-26.sql', 204800, 'completed', '2024-03-26 01:00:00+00', 1, ARRAY['transactions','activity_logs'], 25),
('نسخة احتياطية شهرية - فبراير 2024', 'النسخة الاحتياطية الشهرية', 'full', '/backups/monthly-backup-2024-02.sql', 2097152, 'completed', '2024-03-01 03:00:00+00', 1, ARRAY['users','projects','transactions','documents','deferred_payments'], 380);

-- ===================================================================
-- 15. إنشاء تقارير مخصصة
-- ===================================================================

INSERT INTO custom_reports (name, description, query_config, created_by, is_public) VALUES
('تقرير المبيعات الشهرية', 'تقرير مفصل عن الدخل الشهري من المشاريع', 
'{"type": "income_summary", "period": "monthly", "fields": ["date", "amount", "project_name", "description"]}', 
1, true),

('تقرير المصاريف حسب النوع', 'تحليل المصاريف مقسمة حسب أنواعها', 
'{"type": "expense_analysis", "group_by": "expense_type", "fields": ["expense_type", "total_amount", "percentage"]}', 
3, false),

('تقرير أداء المشاريع', 'تقرير شامل عن حالة وأداء المشاريع الجارية', 
'{"type": "project_performance", "status": "active", "fields": ["name", "progress", "budget_utilization", "remaining_amount"]}', 
2, true);

-- ===================================================================
-- تحديث المبالغ المنفقة في المشاريع
-- ===================================================================

-- تحديث المبالغ المنفقة لكل مشروع بناءً على المعاملات
UPDATE projects SET spent_amount = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM transactions 
    WHERE project_id = projects.id 
    AND type = 'expense' 
    AND status = 'completed'
);

-- حساب التقدم بناءً على الميزانية المستخدمة
UPDATE projects SET progress = (
    SELECT CASE 
        WHEN budget > 0 THEN LEAST(100, ROUND((spent_amount / budget) * 100))
        ELSE 0 
    END
);

-- ===================================================================
-- إحصائيات سريعة للتحقق من البيانات
-- ===================================================================

-- عرض ملخص سريع للبيانات المُدخلة
SELECT 'المستخدمين' as النوع, COUNT(*) as العدد FROM users
UNION ALL
SELECT 'الموظفين', COUNT(*) FROM employees
UNION ALL
SELECT 'المشاريع', COUNT(*) FROM projects
UNION ALL
SELECT 'المعاملات المالية', COUNT(*) FROM transactions
UNION ALL
SELECT 'المدفوعات المؤجلة', COUNT(*) FROM deferred_payments
UNION ALL
SELECT 'الأعمال المكتملة', COUNT(*) FROM completed_works
UNION ALL
SELECT 'الوثائق', COUNT(*) FROM documents
UNION ALL
SELECT 'الإشعارات', COUNT(*) FROM notifications
UNION ALL
SELECT 'سجل الأنشطة', COUNT(*) FROM activity_logs;

-- ===================================================================
-- نهاية البيانات التجريبية
-- ===================================================================
