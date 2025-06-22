-- إنشاء جداول النظام في Supabase
-- يرجى تشغيل هذا الملف في SQL Editor في لوحة تحكم Supabase

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,

  email VARCHAR(255) UNIQUE,
  role VARCHAR(50) DEFAULT 'user',
  permissions TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول المشاريع
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  budget DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول المعاملات
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(50) NOT NULL,
  date TIMESTAMP DEFAULT NOW(),
  user_id INTEGER,
  project_id INTEGER,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- جدول الصناديق
CREATE TABLE IF NOT EXISTS funds (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER,
  project_id INTEGER,
  balance DECIMAL(15,2) DEFAULT 0,
  fund_type VARCHAR(50) DEFAULT 'project',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- جدول الوثائق
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  project_id INTEGER,
  uploaded_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- جدول الإعدادات
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول نشاطات النظام
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- جدول ربط المستخدمين بالمشاريع
CREATE TABLE IF NOT EXISTS user_projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  UNIQUE(user_id, project_id)
);

-- جدول أنواع المصروفات
CREATE TABLE IF NOT EXISTS expense_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول دفتر الأستاذ
CREATE TABLE IF NOT EXISTS ledger_entries (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER,
  project_id INTEGER,
  expense_type_id INTEGER,
  entry_type VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (expense_type_id) REFERENCES expense_types(id)
);

-- جدول فئات الحسابات
CREATE TABLE IF NOT EXISTS account_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_type VARCHAR(50) DEFAULT 'expense',
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول المدفوعات المؤجلة
CREATE TABLE IF NOT EXISTS deferred_payments (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  remaining_amount DECIMAL(15,2) NOT NULL,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'pending',
  project_id INTEGER,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- جدول الجلسات
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

-- إدراج البيانات الأساسية
INSERT INTO users (username, password, name, email, role, permissions) VALUES 
('admin', '$2b$10$JY9vxrUBxZJq8.xpZhGfzOYnVwQQ8hDGvQUZceFM9.hQzUeLM.vNu', 'مدير النظام', 'admin@example.com', 'admin', 
ARRAY['view_dashboard','manage_users','view_users','manage_projects','view_projects','manage_project_transactions','view_project_transactions','manage_transactions','view_transactions','manage_documents','view_documents','view_reports','view_activity_logs','manage_settings'])
ON CONFLICT (username) DO NOTHING;

INSERT INTO settings (key, value) VALUES 
('company_name', 'شركة المحاسبة المتقدمة'),
('currency', 'ريال سعودي'),
('timezone', 'Asia/Riyadh')
ON CONFLICT (key) DO NOTHING;

INSERT INTO expense_types (name, description) VALUES 
('مصروفات إدارية', 'المصروفات الإدارية العامة'),
('مصروفات تشغيلية', 'مصروفات التشغيل اليومي'),
('مصروفات رأسمالية', 'استثمارات طويلة المدى')
ON CONFLICT DO NOTHING;

-- إنشاء المؤشرات
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_project_id ON user_projects(project_id);