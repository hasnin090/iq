-- سكريبت إنشاء قاعدة البيانات للنظام المحاسبي العربي
-- نسخ هذا الكود والصقه في Supabase SQL Editor

-- إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    permissions JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول المشاريع
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    budget INTEGER DEFAULT 0,
    spent INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    progress INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول المعاملات المالية
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    expense_type VARCHAR(100),
    description TEXT NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    created_by INTEGER REFERENCES users(id),
    employee_id INTEGER,
    file_url TEXT,
    file_type TEXT,
    archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول ربط المستخدمين بالمشاريع
CREATE TABLE IF NOT EXISTS user_projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    UNIQUE(user_id, project_id)
);

-- إنشاء جدول المستندات
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    uploaded_by INTEGER REFERENCES users(id),
    is_manager_document BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إدراج مستخدم إداري افتراضي
INSERT INTO users (username, password, name, email, role) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'المدير العام', 'admin@example.com', 'admin')
ON CONFLICT (username) DO NOTHING;

-- إدراج أنواع المصروفات الافتراضية
INSERT INTO transactions (date, amount, type, description, created_by, created_at) 
SELECT CURRENT_TIMESTAMP, 0, 'expense', 'إعداد النظام', 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM transactions);

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- رسالة نجاح
SELECT 'تم إنشاء قاعدة البيانات بنجاح! 🎉' AS status;
