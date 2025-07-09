-- إعداد قاعدة البيانات - نظام المحاسبة العربي
-- ملف SQL لإنشاء الجداول والإعدادات الأساسية

-- تمكين Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول المشاريع
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    budget DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    manager_id UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول المعاملات
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT,
    description TEXT,
    reference_number TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id),
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'credit_card', 'check')),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    transaction_date DATE DEFAULT CURRENT_DATE,
    attachment_url TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول المرفقات
CREATE TABLE IF NOT EXISTS attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الفئات
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول تقارير النشاط
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- إنشاء Functions للتحديث التلقائي لـ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء Triggers لتحديث updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إدراج بيانات أولية للفئات
INSERT INTO categories (name, type, description, color) VALUES
    ('مبيعات', 'income', 'إيرادات من المبيعات', '#10B981'),
    ('خدمات', 'income', 'إيرادات من الخدمات', '#059669'),
    ('استثمارات', 'income', 'عوائد الاستثمارات', '#047857'),
    
    ('مرتبات', 'expense', 'رواتب الموظفين', '#EF4444'),
    ('إيجار', 'expense', 'إيجار المكاتب والمعدات', '#DC2626'),
    ('كهرباء ومياه', 'expense', 'فواتير الخدمات', '#B91C1C'),
    ('مواصلات', 'expense', 'تكاليف النقل والمواصلات', '#991B1B'),
    ('تسويق', 'expense', 'مصروفات التسويق والإعلان', '#7C2D12'),
    ('مكتبية', 'expense', 'مستلزمات مكتبية', '#92400E'),
    ('صيانة', 'expense', 'صيانة الأجهزة والمعدات', '#A16207')
ON CONFLICT DO NOTHING;

-- إنشاء مستخدم افتراضي (Admin)
INSERT INTO users (name, email, role) VALUES
    ('المدير العام', 'admin@example.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- إنشاء Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies للمستخدمين
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR 
                     EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin'));

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin'));

-- Policies للمشاريع
CREATE POLICY "Users can view projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage projects" ON projects
    FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role IN ('admin', 'manager')));

-- Policies للمعاملات
CREATE POLICY "Users can view transactions" ON transactions
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own transactions" ON transactions
    FOR ALL USING (user_id::text = auth.uid()::text OR 
                   EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role IN ('admin', 'manager')));

-- إنشاء Functions للإحصائيات
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM users WHERE is_active = true),
        'total_projects', (SELECT COUNT(*) FROM projects),
        'active_projects', (SELECT COUNT(*) FROM projects WHERE status = 'active'),
        'total_transactions', (SELECT COUNT(*) FROM transactions),
        'total_income', (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'income'),
        'total_expenses', (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'expense'),
        'monthly_income', (SELECT COALESCE(SUM(amount), 0) FROM transactions 
                          WHERE type = 'income' AND DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE)),
        'monthly_expenses', (SELECT COALESCE(SUM(amount), 0) FROM transactions 
                           WHERE type = 'expense' AND DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE))
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء Function لتسجيل النشاط
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_action TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_record_id UUID DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO activity_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (p_user_id, p_action, p_table_name, p_record_id, p_old_data, p_new_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح الصلاحيات
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- إنشاء Storage bucket للمرفقات
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload attachments" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Users can view attachments" ON storage.objects
    FOR SELECT USING (bucket_id = 'attachments');

CREATE POLICY "Users can update their attachments" ON storage.objects
    FOR UPDATE USING (bucket_id = 'attachments');

CREATE POLICY "Users can delete their attachments" ON storage.objects
    FOR DELETE USING (bucket_id = 'attachments');

COMMENT ON TABLE users IS 'جدول المستخدمين - يحتوي على بيانات جميع مستخدمي النظام';
COMMENT ON TABLE projects IS 'جدول المشاريع - يحتوي على بيانات المشاريع وتفاصيلها';
COMMENT ON TABLE transactions IS 'جدول المعاملات المالية - يحتوي على جميع العمليات المالية';
COMMENT ON TABLE categories IS 'جدول فئات المعاملات - لتصنيف الإيرادات والمصروفات';
COMMENT ON TABLE attachments IS 'جدول المرفقات - لحفظ ملفات المعاملات والمشاريع';
COMMENT ON TABLE activity_logs IS 'جدول سجل النشاطات - لتسجيل جميع عمليات المستخدمين';
