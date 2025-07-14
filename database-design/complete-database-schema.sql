-- ===================================================================
-- نظام المحاسبة العربي - مخطط قاعدة البيانات الشامل
-- Arabic Accounting System - Complete Database Schema
-- ===================================================================

-- ===================================================================
-- 1. جدول المستخدمين (Users)
-- ===================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- admin, manager, user, accountant
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 2. جدول المشاريع (Projects)
-- ===================================================================
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- active, completed, paused, cancelled
    budget DECIMAL(15,2),
    spent_amount DECIMAL(15,2) DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    created_by INTEGER REFERENCES users(id),
    assigned_users INTEGER[], -- Array of user IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 3. جدول أنواع المصاريف (Expense Types)
-- ===================================================================
CREATE TABLE expense_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366F1', -- Hex color
    icon VARCHAR(50), -- Lucide icon name
    is_active BOOLEAN DEFAULT true,
    parent_id INTEGER REFERENCES expense_types(id), -- For hierarchical categories
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 4. جدول الموظفين (Employees)
-- ===================================================================
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    position VARCHAR(255),
    department VARCHAR(255),
    salary DECIMAL(12,2),
    hire_date DATE,
    birth_date DATE,
    address TEXT,
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(20),
    bank_account VARCHAR(50),
    national_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 5. جدول ربط الموظفين بالمشاريع (Employee Projects)
-- ===================================================================
CREATE TABLE employee_projects (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(255), -- Project role
    hourly_rate DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, project_id)
);

-- ===================================================================
-- 6. جدول المعاملات المالية (Transactions)
-- ===================================================================
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(20) NOT NULL, -- income, expense
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    expense_type_id INTEGER REFERENCES expense_types(id),
    project_id INTEGER REFERENCES projects(id),
    employee_id INTEGER REFERENCES employees(id), -- For salary payments
    created_by INTEGER REFERENCES users(id),
    
    -- File attachments
    file_url TEXT,
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size INTEGER,
    
    -- Additional metadata
    reference_number VARCHAR(100),
    payment_method VARCHAR(50), -- cash, bank_transfer, credit_card, check
    bank_account VARCHAR(100),
    check_number VARCHAR(50),
    
    -- Status and workflow
    status VARCHAR(20) DEFAULT 'completed', -- pending, completed, cancelled
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Categorization
    tags TEXT[], -- Array of tags
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency VARCHAR(20), -- monthly, quarterly, yearly
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 7. جدول المدفوعات المؤجلة (Deferred Payments)
-- ===================================================================
CREATE TABLE deferred_payments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    
    -- Related entities
    project_id INTEGER REFERENCES projects(id),
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    
    -- Payment tracking
    paid_amount DECIMAL(15,2) DEFAULT 0,
    paid_date DATE,
    payment_method VARCHAR(50),
    transaction_id INTEGER REFERENCES transactions(id),
    
    -- Reminders
    reminder_days INTEGER DEFAULT 7,
    last_reminder_sent TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 8. جدول الأعمال المكتملة (Completed Works)
-- ===================================================================
CREATE TABLE completed_works (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id INTEGER REFERENCES projects(id),
    completed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_by INTEGER REFERENCES users(id),
    
    -- Work details
    deliverables TEXT[], -- Array of deliverable items
    hours_spent DECIMAL(8,2),
    estimated_hours DECIMAL(8,2),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    
    -- Client feedback
    client_approval BOOLEAN DEFAULT false,
    client_feedback TEXT,
    client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
    
    -- Status and workflow
    status VARCHAR(20) DEFAULT 'completed', -- completed, reviewed, approved, rejected
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 9. جدول مستندات الأعمال المكتملة (Completed Work Documents)
-- ===================================================================
CREATE TABLE completed_work_documents (
    id SERIAL PRIMARY KEY,
    work_id INTEGER REFERENCES completed_works(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 10. جدول الوثائق (Documents)
-- ===================================================================
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    
    -- Organization
    category VARCHAR(100),
    tags TEXT[], -- Array of tags
    project_id INTEGER REFERENCES projects(id),
    is_manager_document BOOLEAN DEFAULT false,
    
    -- Access control
    uploaded_by INTEGER REFERENCES users(id),
    visibility VARCHAR(20) DEFAULT 'private', -- public, private, restricted
    allowed_users INTEGER[], -- Array of user IDs who can access
    
    -- Metadata
    version INTEGER DEFAULT 1,
    is_latest_version BOOLEAN DEFAULT true,
    parent_document_id INTEGER REFERENCES documents(id),
    
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 11. جدول ربط الوثائق بالمعاملات (Document Transaction Links)
-- ===================================================================
CREATE TABLE document_transaction_links (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    link_type VARCHAR(50) DEFAULT 'attachment', -- attachment, reference, related
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, transaction_id)
);

-- ===================================================================
-- 12. جدول سجل الأنشطة (Activity Log)
-- ===================================================================
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- create, update, delete, login, logout
    entity_type VARCHAR(50), -- user, project, transaction, document
    entity_id INTEGER,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB, -- Additional data as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 13. جدول الإعدادات (Settings)
-- ===================================================================
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    data_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
    is_public BOOLEAN DEFAULT false, -- Can be accessed by non-admin users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 14. جدول الإشعارات (Notifications)
-- ===================================================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info', -- info, warning, error, success
    
    -- Related entity
    entity_type VARCHAR(50), -- project, transaction, payment
    entity_id INTEGER,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery
    delivery_method VARCHAR(20) DEFAULT 'in_app', -- in_app, email, sms
    sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 15. جدول تتبع الميزانية (Budget Tracking)
-- ===================================================================
CREATE TABLE budget_tracking (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    expense_type_id INTEGER REFERENCES expense_types(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Budget amounts
    planned_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, completed, exceeded
    alert_threshold DECIMAL(5,2) DEFAULT 80.00, -- Alert when % of budget used
    
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 16. جدول تقارير مخصصة (Custom Reports)
-- ===================================================================
CREATE TABLE custom_reports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    query_config JSONB NOT NULL, -- Report configuration as JSON
    
    -- Sharing and access
    created_by INTEGER REFERENCES users(id),
    is_public BOOLEAN DEFAULT false,
    shared_with INTEGER[], -- Array of user IDs
    
    -- Scheduling
    is_scheduled BOOLEAN DEFAULT false,
    schedule_frequency VARCHAR(20), -- daily, weekly, monthly
    last_generated TIMESTAMP WITH TIME ZONE,
    next_generation TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 17. جدول WhatsApp Integration
-- ===================================================================
CREATE TABLE whatsapp_messages (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'notification', -- notification, reminder, alert
    
    -- Related entity
    entity_type VARCHAR(50), -- payment, project, transaction
    entity_id INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Metadata
    sent_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 18. جدول النسخ الاحتياطية (Backups)
-- ===================================================================
CREATE TABLE backups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    backup_type VARCHAR(20) NOT NULL, -- full, incremental, differential
    file_path TEXT,
    file_size BIGINT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, failed
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Metadata
    created_by INTEGER REFERENCES users(id),
    tables_included TEXT[], -- Array of table names
    records_count INTEGER,
    compression_ratio DECIMAL(5,2)
);

-- ===================================================================
-- INDEXES للأداء الأمثل
-- ===================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Projects indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);

-- Transactions indexes
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_project_id ON transactions(project_id);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_transactions_expense_type_id ON transactions(expense_type_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Deferred payments indexes
CREATE INDEX idx_deferred_payments_due_date ON deferred_payments(due_date);
CREATE INDEX idx_deferred_payments_status ON deferred_payments(status);
CREATE INDEX idx_deferred_payments_project_id ON deferred_payments(project_id);

-- Documents indexes
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_is_manager_document ON documents(is_manager_document);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ===================================================================
-- TRIGGERS للتحديث التلقائي
-- ===================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deferred_payments_updated_at BEFORE UPDATE ON deferred_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_completed_works_updated_at BEFORE UPDATE ON completed_works FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_tracking_updated_at BEFORE UPDATE ON budget_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- VIEWS للتقارير السريعة
-- ===================================================================

-- View for transaction summaries
CREATE VIEW transaction_summary AS
SELECT 
    DATE_TRUNC('month', date) as month,
    type,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM transactions 
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', date), type;

-- View for project financial summary
CREATE VIEW project_financial_summary AS
SELECT 
    p.id,
    p.name,
    p.budget,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
    p.budget - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as remaining_budget
FROM projects p
LEFT JOIN transactions t ON p.id = t.project_id AND t.status = 'completed'
GROUP BY p.id, p.name, p.budget;

-- View for overdue payments
CREATE VIEW overdue_payments AS
SELECT 
    dp.*,
    CURRENT_DATE - dp.due_date as days_overdue
FROM deferred_payments dp
WHERE dp.status = 'pending' 
AND dp.due_date < CURRENT_DATE;

-- ===================================================================
-- FUNCTIONS للعمليات المعقدة
-- ===================================================================

-- Function to calculate project progress based on completed works
CREATE OR REPLACE FUNCTION calculate_project_progress(project_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total_works INTEGER;
    completed_works INTEGER;
    progress_percentage INTEGER;
BEGIN
    -- Count total planned works (this would need to be tracked separately)
    -- For now, we'll base it on budget utilization
    SELECT 
        CASE 
            WHEN p.budget > 0 THEN 
                LEAST(100, ROUND((COALESCE(SUM(t.amount), 0) / p.budget) * 100))
            ELSE 0 
        END
    INTO progress_percentage
    FROM projects p
    LEFT JOIN transactions t ON p.id = t.project_id AND t.type = 'expense' AND t.status = 'completed'
    WHERE p.id = project_id_param
    GROUP BY p.id, p.budget;
    
    RETURN COALESCE(progress_percentage, 0);
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- البيانات الأولية (Initial Data)
-- ===================================================================

-- Insert default expense types
INSERT INTO expense_types (name, description, color, icon) VALUES
('مصروف عام', 'مصاريف عامة غير مصنفة', '#6366F1', 'DollarSign'),
('راتب', 'رواتب الموظفين', '#10B981', 'Users'),
('إيجار', 'إيجار المكاتب والمعدات', '#F59E0B', 'Home'),
('مواصلات', 'مصاريف النقل والمواصلات', '#3B82F6', 'Car'),
('اتصالات', 'فواتير الهاتف والإنترنت', '#8B5CF6', 'Phone'),
('كهرباء', 'فواتير الكهرباء', '#EF4444', 'Zap'),
('مياه', 'فواتير المياه', '#06B6D4', 'Droplets'),
('مكتبية', 'مستلزمات مكتبية', '#84CC16', 'FileText'),
('صيانة', 'أعمال الصيانة والإصلاح', '#F97316', 'Wrench'),
('تسويق', 'مصاريف التسويق والإعلان', '#EC4899', 'Megaphone'),
('ضرائب', 'الضرائب والرسوم الحكومية', '#6B7280', 'Receipt'),
('تأمين', 'بوالص التأمين', '#14B8A6', 'Shield');

-- Insert default settings
INSERT INTO settings (key, value, description, category, data_type, is_public) VALUES
('app_name', 'نظام المحاسبة العربي', 'اسم التطبيق', 'general', 'string', true),
('currency', 'USD', 'العملة الافتراضية', 'general', 'string', true),
('timezone', 'Asia/Baghdad', 'المنطقة الزمنية', 'general', 'string', false),
('language', 'ar', 'اللغة الافتراضية', 'general', 'string', true),
('decimal_places', '2', 'عدد الخانات العشرية', 'general', 'number', true),
('backup_frequency', 'daily', 'تكرار النسخ الاحتياطي', 'backup', 'string', false),
('max_file_size', '10485760', 'حد أقصى لحجم الملف (بايت)', 'files', 'number', false),
('allowed_file_types', 'pdf,jpg,jpeg,png,doc,docx,xls,xlsx', 'أنواع الملفات المسموحة', 'files', 'string', false);

-- ===================================================================
-- CONSTRAINTS إضافية للتحقق من صحة البيانات
-- ===================================================================

-- Ensure transaction amounts are positive
ALTER TABLE transactions ADD CONSTRAINT check_positive_amount CHECK (amount > 0);

-- Ensure due dates are not in the past for new deferred payments
-- (This would typically be handled in application logic)

-- Ensure project end date is after start date
ALTER TABLE projects ADD CONSTRAINT check_project_dates 
CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

-- Ensure user roles are valid
ALTER TABLE users ADD CONSTRAINT check_user_role 
CHECK (role IN ('admin', 'manager', 'user', 'accountant'));

-- Ensure transaction types are valid
ALTER TABLE transactions ADD CONSTRAINT check_transaction_type 
CHECK (type IN ('income', 'expense'));

-- ===================================================================
-- COMMENTS لتوثيق الجداول
-- ===================================================================

COMMENT ON TABLE users IS 'جدول المستخدمين - يحتوي على معلومات المستخدمين وصلاحياتهم';
COMMENT ON TABLE projects IS 'جدول المشاريع - يحتوي على معلومات المشاريع وتفاصيلها';
COMMENT ON TABLE transactions IS 'جدول المعاملات المالية - يحتوي على جميع العمليات المالية';
COMMENT ON TABLE deferred_payments IS 'جدول المدفوعات المؤجلة - لتتبع المدفوعات المستحقة';
COMMENT ON TABLE completed_works IS 'جدول الأعمال المكتملة - لتتبع الأعمال المنجزة';
COMMENT ON TABLE documents IS 'جدول الوثائق - لإدارة الملفات والمستندات';
COMMENT ON TABLE activity_logs IS 'جدول سجل الأنشطة - لتتبع جميع العمليات في النظام';
COMMENT ON TABLE settings IS 'جدول الإعدادات - لحفظ إعدادات النظام';

-- ===================================================================
-- نهاية مخطط قاعدة البيانات
-- ===================================================================
