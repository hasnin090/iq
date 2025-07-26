-- ===================================================================
-- مخطط قاعدة البيانات الكامل لنظام المحاسبة العربي - شركة طريق العامرة
-- Arabic Accounting System - Complete Database Schema for Supabase
-- تم إنشاؤه في: يوليو 2025
-- ===================================================================

-- ===================================================================
-- 1. جدول الملفات الشخصية للمستخدمين (profiles)
-- ===================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'manager', 'user', 'viewer', 'accountant')) DEFAULT 'user',
    permissions TEXT[] DEFAULT '{}',
    phone VARCHAR(20),
    avatar_url TEXT,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 2. جدول المشاريع (projects)
-- ===================================================================
-- Add owner_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'projects' AND column_name = 'owner_id') THEN
        ALTER TABLE projects ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')) DEFAULT 'active',
    budget DECIMAL(15,2) DEFAULT 0 CHECK (budget >= 0),
    spent DECIMAL(15,2) DEFAULT 0 CHECK (spent >= 0),
    remaining DECIMAL(15,2) GENERATED ALWAYS AS (budget - spent) STORED,
    client_name TEXT,
    client_contact TEXT,
    start_date DATE,
    end_date DATE,
    active BOOLEAN DEFAULT true,
    owner_id UUID REFERENCES auth.users(id),
    location TEXT,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_project_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- ===================================================================
-- 3. جدول أدوار المستخدمين (user_roles)
-- ===================================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'manager', 'member', 'viewer')) DEFAULT 'member',
    assigned_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, project_id)
);

-- ===================================================================
-- 4. جدول أنواع المصروفات (expense_types)
-- ===================================================================
CREATE TABLE IF NOT EXISTS expense_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT true,
    category TEXT CHECK (category IN ('materials', 'labor', 'equipment', 'administrative', 'other')) DEFAULT 'other',
    budget_limit DECIMAL(15,2),
    color VARCHAR(7) DEFAULT '#6366F1',
    icon VARCHAR(50),
    parent_id INTEGER REFERENCES expense_types(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 5. جدول الموظفين (employees)
-- ===================================================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code VARCHAR(50) UNIQUE,
    name TEXT NOT NULL,
    position TEXT,
    salary DECIMAL(15,2) DEFAULT 0 CHECK (salary >= 0),
    contact TEXT,
    email VARCHAR(255),
    phone VARCHAR(20),
    join_date DATE DEFAULT CURRENT_DATE,
    active BOOLEAN DEFAULT true,
    project_id UUID REFERENCES projects(id),
    national_id TEXT,
    address TEXT,
    emergency_contact TEXT,
    emergency_phone VARCHAR(20),
    bank_account VARCHAR(100),
    department TEXT,
    hire_date DATE,
    birth_date DATE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 6. جدول ربط الموظفين بالمشاريع (employee_projects)
-- ===================================================================
CREATE TABLE IF NOT EXISTS employee_projects (
    id SERIAL PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    role TEXT,
    hourly_rate DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employee_id, project_id)
);

-- ===================================================================
-- 7. جدول المعاملات المالية (transactions)
-- ===================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    expense_type_id INTEGER REFERENCES expense_types(id),
    employee_id UUID REFERENCES employees(id),
    project_id UUID REFERENCES projects(id),
    reference_number VARCHAR(100),
    payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'check', 'online')) DEFAULT 'cash',
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')) DEFAULT 'completed',
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    
    -- File attachments
    file_url TEXT,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_size INTEGER,
    
    -- Additional fields
    bank_account VARCHAR(100),
    check_number VARCHAR(50),
    tags TEXT[],
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly')),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 8. جدول المستندات (documents)
-- ===================================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    file_path TEXT,
    file_size INTEGER,
    file_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    project_id UUID REFERENCES projects(id),
    is_manager_document BOOLEAN DEFAULT false,
    
    -- Access control
    visibility TEXT CHECK (visibility IN ('public', 'private', 'restricted')) DEFAULT 'private',
    allowed_users UUID[],
    
    -- Versioning
    version INTEGER DEFAULT 1,
    is_latest_version BOOLEAN DEFAULT true,
    parent_document_id UUID REFERENCES documents(id),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 9. جدول روابط المستندات (document_links)
-- ===================================================================
CREATE TABLE IF NOT EXISTS document_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'transaction', 'employee', 'receivable')),
    entity_id UUID NOT NULL,
    link_type TEXT CHECK (link_type IN ('attachment', 'reference', 'related')) DEFAULT 'attachment',
    linked_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(document_id, entity_type, entity_id)
);

-- ===================================================================
-- 10. جدول سجل الأنشطة (activity_logs)
-- ===================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    description TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 11. جدول القيود المحاسبية (ledger_entries)
-- ===================================================================
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_type TEXT CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
    debit DECIMAL(15,2) DEFAULT 0 CHECK (debit >= 0),
    credit DECIMAL(15,2) DEFAULT 0 CHECK (credit >= 0),
    balance DECIMAL(15,2),
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    reference_number VARCHAR(100),
    expense_type_id INTEGER REFERENCES expense_types(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CHECK ((debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0))
);

-- ===================================================================
-- 12. جدول المستحقات (receivables)
-- ===================================================================
CREATE TABLE IF NOT EXISTS receivables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    title TEXT NOT NULL,
    beneficiary_name TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    paid_amount DECIMAL(15,2) DEFAULT 0 CHECK (paid_amount >= 0),
    due_date DATE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'partially_paid', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
    description TEXT,
    client_name TEXT,
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    contact_info TEXT,
    
    -- Payment tracking
    payment_method TEXT,
    transaction_id UUID REFERENCES transactions(id),
    
    -- Reminders
    reminder_days INTEGER DEFAULT 7,
    last_reminder_sent TIMESTAMPTZ,
    
    -- Priority
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 13. جدول مدفوعات المستحقات (receivable_payments)
-- ===================================================================
CREATE TABLE IF NOT EXISTS receivable_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receivable_id UUID REFERENCES receivables(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash',
    reference_number TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 14. جدول الأعمال المكتملة (completed_works)
-- ===================================================================
DROP TABLE IF EXISTS completed_work_documents CASCADE;
DROP TABLE IF EXISTS completed_works CASCADE;

CREATE TABLE completed_works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id),
    completed_date TIMESTAMPTZ DEFAULT now(),
    completed_by UUID REFERENCES auth.users(id),
    
    -- Work details
    deliverables TEXT[],
    hours_spent DECIMAL(8,2),
    estimated_hours DECIMAL(8,2),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    
    -- Client feedback
    client_approval BOOLEAN DEFAULT false,
    client_feedback TEXT,
    client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
    
    -- Status and workflow
    status TEXT CHECK (status IN ('completed', 'reviewed', 'approved', 'rejected')) DEFAULT 'completed',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 15. جدول مستندات الأعمال المكتملة (completed_work_documents)
-- ===================================================================
CREATE TABLE completed_work_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID REFERENCES completed_works(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 16. جدول إعدادات النظام (settings)
-- ===================================================================
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category TEXT DEFAULT 'general',
    type TEXT CHECK (type IN ('string', 'number', 'boolean', 'json')) DEFAULT 'string',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 17. جدول الإشعارات (notifications)
-- ===================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT CHECK (type IN ('info', 'warning', 'error', 'success')) DEFAULT 'info',
    
    -- Related entity
    entity_type TEXT,
    entity_id UUID,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Delivery
    delivery_method TEXT CHECK (delivery_method IN ('in_app', 'email', 'sms')) DEFAULT 'in_app',
    sent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 18. جدول تتبع الميزانية (budget_tracking)
-- ===================================================================
CREATE TABLE IF NOT EXISTS budget_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    expense_type_id INTEGER REFERENCES expense_types(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Budget amounts
    planned_amount DECIMAL(15,2) NOT NULL CHECK (planned_amount >= 0),
    actual_amount DECIMAL(15,2) DEFAULT 0 CHECK (actual_amount >= 0),
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (planned_amount - actual_amount) STORED,
    
    -- Status
    status TEXT CHECK (status IN ('active', 'completed', 'exceeded')) DEFAULT 'active',
    alert_threshold DECIMAL(5,2) DEFAULT 80.00 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
    
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CHECK (period_end >= period_start)
);

-- ===================================================================
-- 19. جدول التقارير المخصصة (custom_reports)
-- ===================================================================
CREATE TABLE IF NOT EXISTS custom_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    query_config JSONB NOT NULL,
    
    -- Sharing and access
    created_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT false,
    shared_with UUID[],
    
    -- Scheduling
    is_scheduled BOOLEAN DEFAULT false,
    schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
    last_generated TIMESTAMPTZ,
    next_generation TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 20. جدول رسائل WhatsApp (whatsapp_messages)
-- ===================================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('notification', 'reminder', 'alert')) DEFAULT 'notification',
    
    -- Related entity
    entity_type TEXT,
    entity_id UUID,
    
    -- Status
    status TEXT CHECK (status IN ('pending', 'sent', 'delivered', 'failed')) DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- Metadata
    sent_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 21. جدول النسخ الاحتياطية (backups)
-- ===================================================================
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    backup_type TEXT CHECK (backup_type IN ('full', 'incremental', 'differential')) NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    
    -- Status
    status TEXT CHECK (status IN ('in_progress', 'completed', 'failed')) DEFAULT 'in_progress',
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    tables_included TEXT[],
    records_count INTEGER,
    compression_ratio DECIMAL(5,2)
);

-- ===================================================================
-- Enable Row-Level Security (RLS)
-- ===================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_work_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- Function to update 'updated_at' column
-- ===================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- Triggers for updating 'updated_at'
-- ===================================================================
DROP TRIGGER IF EXISTS trg_update_profiles ON profiles;
DROP TRIGGER IF EXISTS trg_update_projects ON projects;
DROP TRIGGER IF EXISTS trg_update_expense_types ON expense_types;
DROP TRIGGER IF EXISTS trg_update_employees ON employees;
DROP TRIGGER IF EXISTS trg_update_transactions ON transactions;
DROP TRIGGER IF EXISTS trg_update_documents ON documents;
DROP TRIGGER IF EXISTS trg_update_ledger_entries ON ledger_entries;
DROP TRIGGER IF EXISTS trg_update_receivables ON receivables;
DROP TRIGGER IF EXISTS trg_update_completed_works ON completed_works;
DROP TRIGGER IF EXISTS trg_update_settings ON settings;
DROP TRIGGER IF EXISTS trg_update_budget_tracking ON budget_tracking;
DROP TRIGGER IF EXISTS trg_update_custom_reports ON custom_reports;

CREATE TRIGGER trg_update_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_projects BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_expense_types BEFORE UPDATE ON expense_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_employees BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_transactions BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_documents BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_ledger_entries BEFORE UPDATE ON ledger_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_receivables BEFORE UPDATE ON receivables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_completed_works BEFORE UPDATE ON completed_works FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_settings BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_budget_tracking BEFORE UPDATE ON budget_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_custom_reports BEFORE UPDATE ON custom_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- RLS Policies
-- ===================================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can view project roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions for their projects" ON transactions;
DROP POLICY IF EXISTS "Users can update their transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their documents" ON documents;
DROP POLICY IF EXISTS "Users can update their documents" ON documents;
DROP POLICY IF EXISTS "Users can create documents" ON documents;
DROP POLICY IF EXISTS "Users can view their logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can view employees" ON employees;
DROP POLICY IF EXISTS "Users can update their employees" ON employees;
DROP POLICY IF EXISTS "Users can create employees" ON employees;
DROP POLICY IF EXISTS "Users can view their receivables" ON receivables;
DROP POLICY IF EXISTS "Users can update their receivables" ON receivables;
DROP POLICY IF EXISTS "Users can create receivables" ON receivables;
DROP POLICY IF EXISTS "Users can view ledger entries" ON ledger_entries;
DROP POLICY IF EXISTS "Users can create ledger entries" ON ledger_entries;
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view completed works" ON completed_works;
DROP POLICY IF EXISTS "Users can create completed works" ON completed_works;
DROP POLICY IF EXISTS "Users can update completed works" ON completed_works;
DROP POLICY IF EXISTS "Users can view work documents" ON completed_work_documents;
DROP POLICY IF EXISTS "Users can create work documents" ON completed_work_documents;
DROP POLICY IF EXISTS "Users can update work documents" ON completed_work_documents;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view their projects" ON projects FOR SELECT
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.project_id = projects.id));
CREATE POLICY "Project owners can update projects" ON projects FOR UPDATE
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.project_id = projects.id AND user_roles.role IN ('owner', 'manager')));
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- User roles policies
CREATE POLICY "Users can view project roles" ON user_roles FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.project_id = user_roles.project_id AND ur.role IN ('owner', 'manager')));

-- Transactions policies
CREATE POLICY "Users can view their transactions" ON transactions FOR SELECT 
    USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.project_id = transactions.project_id));
CREATE POLICY "Users can insert transactions for their projects" ON transactions FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.project_id = transactions.project_id));
CREATE POLICY "Users can update their transactions" ON transactions FOR UPDATE USING (auth.uid() = created_by);

-- Documents policies
CREATE POLICY "Users can view their documents" ON documents FOR SELECT 
    USING (auth.uid() = uploaded_by OR visibility = 'public' OR 
           (visibility = 'restricted' AND auth.uid() = ANY(allowed_users)) OR
           EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.project_id = documents.project_id));
CREATE POLICY "Users can update their documents" ON documents FOR UPDATE USING (auth.uid() = uploaded_by);
CREATE POLICY "Users can create documents" ON documents FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Activity logs policies
CREATE POLICY "Users can view their logs" ON activity_logs FOR SELECT USING (auth.uid() = user_id);

-- Employees policies
CREATE POLICY "Users can view employees" ON employees FOR SELECT 
    USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.project_id = employees.project_id));
CREATE POLICY "Users can update their employees" ON employees FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can create employees" ON employees FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Receivables policies
CREATE POLICY "Users can view their receivables" ON receivables FOR SELECT 
    USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.project_id = receivables.project_id));
CREATE POLICY "Users can update their receivables" ON receivables FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can create receivables" ON receivables FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Ledger entries policies
CREATE POLICY "Users can view ledger entries" ON ledger_entries FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create ledger entries" ON ledger_entries FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Completed works policies
CREATE POLICY "Users can view completed works" ON completed_works FOR SELECT 
    USING (auth.uid() = completed_by OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.project_id = completed_works.project_id));
CREATE POLICY "Users can create completed works" ON completed_works FOR INSERT WITH CHECK (auth.uid() = completed_by);
CREATE POLICY "Users can update completed works" ON completed_works FOR UPDATE USING (auth.uid() = completed_by);

-- Completed work documents policies (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'completed_work_documents') THEN
        EXECUTE 'CREATE POLICY "Users can view work documents" ON completed_work_documents FOR SELECT 
            USING (auth.uid() = uploaded_by OR EXISTS (SELECT 1 FROM completed_works cw JOIN user_roles ur ON cw.project_id = ur.project_id WHERE cw.id = completed_work_documents.work_id AND ur.user_id = auth.uid()))';
        EXECUTE 'CREATE POLICY "Users can create work documents" ON completed_work_documents FOR INSERT WITH CHECK (auth.uid() = uploaded_by)';
        EXECUTE 'CREATE POLICY "Users can update work documents" ON completed_work_documents FOR UPDATE USING (auth.uid() = uploaded_by)';
    END IF;
END $$;

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ===================================================================
-- Indexes for performance optimization
-- ===================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_project_id ON user_roles(project_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Expense types indexes
CREATE INDEX IF NOT EXISTS idx_expense_types_active ON expense_types(active);
CREATE INDEX IF NOT EXISTS idx_expense_types_category ON expense_types(category);
CREATE INDEX IF NOT EXISTS idx_expense_types_parent_id ON expense_types(parent_id);

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_created_by ON employees(created_by);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active);
CREATE INDEX IF NOT EXISTS idx_employees_project_id ON employees(project_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_code ON employees(employee_code);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_expense_type_id ON transactions(expense_type_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_employee_id ON transactions(employee_id);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Ledger entries indexes
CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_name ON ledger_entries(account_name);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_posting_date ON ledger_entries(posting_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created_by ON ledger_entries(created_by);

-- Receivables indexes
CREATE INDEX IF NOT EXISTS idx_receivables_due_date ON receivables(due_date);
CREATE INDEX IF NOT EXISTS idx_receivables_status ON receivables(status);
CREATE INDEX IF NOT EXISTS idx_receivables_created_by ON receivables(created_by);
CREATE INDEX IF NOT EXISTS idx_receivables_project_id ON receivables(project_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Completed works indexes
CREATE INDEX IF NOT EXISTS idx_completed_works_project_id ON completed_works(project_id);
CREATE INDEX IF NOT EXISTS idx_completed_works_completed_by ON completed_works(completed_by);
CREATE INDEX IF NOT EXISTS idx_completed_works_status ON completed_works(status);
CREATE INDEX IF NOT EXISTS idx_completed_works_completed_date ON completed_works(completed_date);

-- Completed work documents indexes (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'completed_work_documents') THEN
        CREATE INDEX IF NOT EXISTS idx_completed_work_documents_work_id ON completed_work_documents(work_id);
        CREATE INDEX IF NOT EXISTS idx_completed_work_documents_uploaded_by ON completed_work_documents(uploaded_by);
        CREATE INDEX IF NOT EXISTS idx_completed_work_documents_uploaded_at ON completed_work_documents(uploaded_at);
    END IF;
END $$;

-- Budget tracking indexes
CREATE INDEX IF NOT EXISTS idx_budget_tracking_project_id ON budget_tracking(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_tracking_expense_type_id ON budget_tracking(expense_type_id);
CREATE INDEX IF NOT EXISTS idx_budget_tracking_period ON budget_tracking(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_budget_tracking_status ON budget_tracking(status);

-- Custom reports indexes
CREATE INDEX IF NOT EXISTS idx_custom_reports_created_by ON custom_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_reports_is_public ON custom_reports(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_reports_is_scheduled ON custom_reports(is_scheduled);

-- WhatsApp messages indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_number ON whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sent_by ON whatsapp_messages(sent_by);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);

-- Backups indexes
CREATE INDEX IF NOT EXISTS idx_backups_created_by ON backups(created_by);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_started_at ON backups(started_at);

-- ===================================================================
-- Views للتقارير السريعة
-- ===================================================================

-- View for transaction summaries
CREATE OR REPLACE VIEW transaction_summary AS
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
CREATE OR REPLACE VIEW project_financial_summary AS
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

-- View for overdue receivables
CREATE OR REPLACE VIEW overdue_receivables AS
SELECT 
    r.*,
    CURRENT_DATE - r.due_date as days_overdue
FROM receivables r
WHERE r.status IN ('pending', 'partially_paid') 
AND r.due_date < CURRENT_DATE;

-- ===================================================================
-- Functions للعمليات المعقدة
-- ===================================================================

-- Function to calculate project progress
CREATE OR REPLACE FUNCTION calculate_project_progress(project_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    progress_percentage INTEGER;
BEGIN
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

-- Function to check user project access
CREATE OR REPLACE FUNCTION user_has_project_access(user_id_param UUID, project_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_id_param 
        AND project_id = project_id_param
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update project spent amount
CREATE OR REPLACE FUNCTION update_project_spent()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.type = 'expense' AND NEW.status = 'completed' THEN
        UPDATE projects 
        SET spent = spent + NEW.amount 
        WHERE id = NEW.project_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.type = 'expense' THEN
        IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
            UPDATE projects 
            SET spent = spent + NEW.amount 
            WHERE id = NEW.project_id;
        ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
            UPDATE projects 
            SET spent = spent - OLD.amount 
            WHERE id = OLD.project_id;
        ELSIF OLD.status = 'completed' AND NEW.status = 'completed' AND OLD.amount != NEW.amount THEN
            UPDATE projects 
            SET spent = spent - OLD.amount + NEW.amount 
            WHERE id = NEW.project_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.type = 'expense' AND OLD.status = 'completed' THEN
        UPDATE projects 
        SET spent = spent - OLD.amount 
        WHERE id = OLD.project_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update project spent amount
DROP TRIGGER IF EXISTS trg_update_project_spent ON transactions;
CREATE TRIGGER trg_update_project_spent
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    WHEN (TG_OP = 'DELETE' OR NEW.project_id IS NOT NULL)
    EXECUTE FUNCTION update_project_spent();

-- ===================================================================
-- البيانات الأولية (Initial Data)
-- ===================================================================

-- Insert default expense types
INSERT INTO expense_types (name, description, category, color, icon) VALUES
('مصروف عام', 'مصاريف عامة غير مصنفة', 'other', '#6366F1', 'DollarSign'),
('راتب موظف', 'رواتب الموظفين والأجور', 'labor', '#10B981', 'Users'),
('إيجار', 'إيجار المكاتب والمعدات', 'administrative', '#F59E0B', 'Home'),
('مواصلات', 'مصاريف النقل والمواصلات', 'administrative', '#3B82F6', 'Car'),
('اتصالات', 'فواتير الهاتف والإنترنت', 'administrative', '#8B5CF6', 'Phone'),
('كهرباء ومياه', 'فواتير الخدمات العامة', 'administrative', '#EF4444', 'Zap'),
('مواد البناء', 'مواد البناء والتشييد', 'materials', '#84CC16', 'Wrench'),
('معدات', 'شراء وصيانة المعدات', 'equipment', '#F97316', 'Settings'),
('مكتبية', 'مستلزمات مكتبية وقرطاسية', 'administrative', '#06B6D4', 'FileText'),
('تسويق', 'مصاريف التسويق والإعلان', 'administrative', '#EC4899', 'Megaphone'),
('ضرائب', 'الضرائب والرسوم الحكومية', 'administrative', '#6B7280', 'Receipt'),
('تأمين', 'بوالص التأمين المختلفة', 'administrative', '#14B8A6', 'Shield'),
('صيانة', 'أعمال الصيانة والإصلاح', 'equipment', '#F59E0B', 'Tool'),
('وقود', 'وقود المركبات والمعدات', 'administrative', '#EF4444', 'Fuel')
ON CONFLICT (name) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value, description, category, type, is_public) VALUES
('app_name', 'نظام المحاسبة العربي - شركة طريق العامرة', 'اسم التطبيق', 'general', 'string', true),
('company_name', 'شركة طريق العامرة', 'اسم الشركة', 'general', 'string', true),
('currency', 'IQD', 'العملة الافتراضية', 'general', 'string', true),
('currency_symbol', 'د.ع', 'رمز العملة', 'general', 'string', true),
('timezone', 'Asia/Baghdad', 'المنطقة الزمنية', 'general', 'string', false),
('language', 'ar', 'اللغة الافتراضية', 'general', 'string', true),
('decimal_places', '2', 'عدد الخانات العشرية', 'general', 'number', true),
('date_format', 'DD/MM/YYYY', 'تنسيق التاريخ', 'general', 'string', true),
('backup_frequency', 'daily', 'تكرار النسخ الاحتياطي', 'backup', 'string', false),
('max_file_size', '10485760', 'حد أقصى لحجم الملف (10 ميجابايت)', 'files', 'number', false),
('allowed_file_types', 'pdf,jpg,jpeg,png,doc,docx,xls,xlsx,zip', 'أنواع الملفات المسموحة', 'files', 'string', false),
('notification_email', 'admin@tariqalamira.com', 'البريد الإلكتروني للإشعارات', 'notifications', 'string', false),
('whatsapp_enabled', 'false', 'تفعيل رسائل واتساب', 'integrations', 'boolean', false),
('auto_backup', 'true', 'النسخ الاحتياطي التلقائي', 'backup', 'boolean', false),
('session_timeout', '480', 'مهلة انتهاء الجلسة (بالدقائق)', 'security', 'number', false),
('max_login_attempts', '5', 'عدد محاولات تسجيل الدخول القصوى', 'security', 'number', false),
('fiscal_year_start', '01-01', 'بداية السنة المالية (شهر-يوم)', 'accounting', 'string', false),
('vat_rate', '0', 'معدل ضريبة القيمة المضافة (%)', 'accounting', 'number', false),
('project_code_prefix', 'PRJ', 'بادئة رقم المشروع', 'projects', 'string', false),
('employee_code_prefix', 'EMP', 'بادئة رقم الموظف', 'employees', 'string', false)
ON CONFLICT (key) DO NOTHING;

-- ===================================================================
-- تعليقات على الجداول للتوثيق
-- ===================================================================

COMMENT ON TABLE profiles IS 'جدول الملفات الشخصية للمستخدمين - معلومات إضافية للمستخدمين المصادق عليهم';
COMMENT ON TABLE projects IS 'جدول المشاريع - معلومات المشاريع وميزانياتها وحالاتها';
COMMENT ON TABLE user_roles IS 'جدول أدوار المستخدمين - تحديد صلاحيات المستخدمين في المشاريع';
COMMENT ON TABLE expense_types IS 'جدول أنواع المصروفات - تصنيف وتنظيم أنواع المصروفات';
COMMENT ON TABLE employees IS 'جدول الموظفين - معلومات الموظفين ورواتبهم';
COMMENT ON TABLE employee_projects IS 'جدول ربط الموظفين بالمشاريع - تخصيص الموظفين للمشاريع';
COMMENT ON TABLE transactions IS 'جدول المعاملات المالية - جميع الإيرادات والمصروفات';
COMMENT ON TABLE documents IS 'جدول المستندات - إدارة الملفات والمستندات المرفقة';
COMMENT ON TABLE document_links IS 'جدول روابط المستندات - ربط المستندات بالكيانات الأخرى';
COMMENT ON TABLE activity_logs IS 'جدول سجل الأنشطة - تتبع جميع العمليات في النظام';
COMMENT ON TABLE ledger_entries IS 'جدول القيود المحاسبية - القيود المحاسبية المزدوجة';
COMMENT ON TABLE receivables IS 'جدول المستحقات - المبالغ المستحقة من العملاء';
COMMENT ON TABLE receivable_payments IS 'جدول مدفوعات المستحقات - تتبع دفعات المستحقات';
COMMENT ON TABLE completed_works IS 'جدول الأعمال المكتملة - الأعمال المنجزة في المشاريع';
COMMENT ON TABLE completed_work_documents IS 'جدول مستندات الأعمال المكتملة - مستندات الأعمال المنجزة';
COMMENT ON TABLE settings IS 'جدول إعدادات النظام - إعدادات وتكوينات النظام';
COMMENT ON TABLE notifications IS 'جدول الإشعارات - إشعارات النظام للمستخدمين';
COMMENT ON TABLE budget_tracking IS 'جدول تتبع الميزانية - مراقبة ميزانيات المشاريع وأنواع المصروفات';
COMMENT ON TABLE custom_reports IS 'جدول التقارير المخصصة - تقارير قابلة للتخصيص والجدولة';
COMMENT ON TABLE whatsapp_messages IS 'جدول رسائل واتساب - تكامل مع واتساب للإشعارات';
COMMENT ON TABLE backups IS 'جدول النسخ الاحتياطية - معلومات النسخ الاحتياطية للبيانات';

-- ===================================================================
-- نهاية مخطط قاعدة البيانات
-- ===================================================================

-- إشعار بنجاح إنشاء المخطط
SELECT 'تم إنشاء مخطط قاعدة البيانات بنجاح - نظام المحاسبة العربي لشركة طريق العامرة' as result;
