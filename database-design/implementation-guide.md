# دليل تنفيذ قاعدة البيانات - نظام المحاسبة العربي

## 📋 نظرة عامة

تم تصميم هذا النظام ليكون قاعدة بيانات شاملة لنظام محاسبة عربي متكامل يدعم:
- إدارة المشاريع والعملاء
- المعاملات المالية (الدخل والمصاريف)
- إدارة الموظفين والرواتب
- تتبع المدفوعات المؤجلة
- إدارة الوثائق والملفات
- نظام التقارير والإحصائيات
- نظام الإشعارات والتنبيهات

## 🚀 خطوات التنفيذ

### 1. إنشاء قاعدة البيانات

```sql
-- إنشاء قاعدة البيانات الجديدة
CREATE DATABASE arabic_accounting_system;

-- التبديل إلى قاعدة البيانات الجديدة
\c arabic_accounting_system;

-- إنشاء الامتدادات المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### 2. تنفيذ المخطط الأساسي

```bash
# تنفيذ مخطط قاعدة البيانات الكامل
psql -U username -d arabic_accounting_system -f complete-database-schema.sql
```

### 3. إدخال البيانات التجريبية

```bash
# تنفيذ البيانات التجريبية (اختياري للتطوير والاختبار)
psql -U username -d arabic_accounting_system -f sample-data.sql
```

### 4. اختبار الاستعلامات

```bash
# تشغيل الاستعلامات التجريبية للتحقق من عمل النظام
psql -U username -d arabic_accounting_system -f common-queries.sql
```

## 🔧 الإعدادات الموصى بها

### إعدادات PostgreSQL للأداء

```sql
-- في ملف postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

### إعدادات الاتصال

```sql
-- في ملف pg_hba.conf
# للتطوير المحلي
host    arabic_accounting_system    accounting_user    127.0.0.1/32    md5

# للإنتاج
hostssl arabic_accounting_system    accounting_user    0.0.0.0/0       md5
```

## 👥 إدارة المستخدمين والصلاحيات

### إنشاء مستخدم قاعدة البيانات

```sql
-- إنشاء مستخدم للتطبيق
CREATE USER accounting_user WITH PASSWORD 'secure_password_here';

-- منح الصلاحيات
GRANT CONNECT ON DATABASE arabic_accounting_system TO accounting_user;
GRANT USAGE ON SCHEMA public TO accounting_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO accounting_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO accounting_user;

-- للجداول المستقبلية
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO accounting_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO accounting_user;
```

### إعداد المستخدمين حسب الأدوار

```sql
-- مستخدم للقراءة فقط (للتقارير)
CREATE USER report_user WITH PASSWORD 'report_password';
GRANT CONNECT ON DATABASE arabic_accounting_system TO report_user;
GRANT USAGE ON SCHEMA public TO report_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO report_user;

-- مستخدم للنسخ الاحتياطي
CREATE USER backup_user WITH PASSWORD 'backup_password';
GRANT CONNECT ON DATABASE arabic_accounting_system TO backup_user;
GRANT USAGE ON SCHEMA public TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
```

## 🔐 الأمان والحماية

### تشفير كلمات المرور

```javascript
// مثال في Node.js لتشفير كلمات المرور
const bcrypt = require('bcryptjs');

async function hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}
```

### حماية من SQL Injection

```javascript
// استخدام Prepared Statements
const query = 'SELECT * FROM users WHERE email = $1 AND password_hash = $2';
const values = [email, passwordHash];
const result = await client.query(query, values);
```

## 📊 مراقبة الأداء

### فهارس إضافية للأداء

```sql
-- فهارس للبحث النصي
CREATE INDEX idx_projects_name_gin ON projects USING gin(name gin_trgm_ops);
CREATE INDEX idx_transactions_description_gin ON transactions USING gin(description gin_trgm_ops);

-- فهارس مركبة للاستعلامات الشائعة
CREATE INDEX idx_transactions_date_type ON transactions(date, type);
CREATE INDEX idx_transactions_project_status ON transactions(project_id, status);
CREATE INDEX idx_deferred_payments_due_status ON deferred_payments(due_date, status);
```

### مراقبة استهلاك الموارد

```sql
-- مراقبة الاستعلامات البطيئة
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- مراقبة حجم الجداول
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

## 🔄 النسخ الاحتياطي والاستعادة

### النسخ الاحتياطي التلقائي

```bash
#!/bin/bash
# backup-script.sh

DB_NAME="arabic_accounting_system"
DB_USER="accounting_user"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# نسخة احتياطية كاملة
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/full_backup_$DATE.sql

# ضغط الملف
gzip $BACKUP_DIR/full_backup_$DATE.sql

# حذف النسخ القديمة (أكثر من 30 يوم)
find $BACKUP_DIR -name "full_backup_*.sql.gz" -mtime +30 -delete
```

### جدولة النسخ الاحتياطي

```bash
# إضافة إلى crontab
# نسخة احتياطية يومية في 2:00 صباحاً
0 2 * * * /path/to/backup-script.sh

# نسخة احتياطية أسبوعية يوم الأحد في 1:00 صباحاً
0 1 * * 0 /path/to/weekly-backup-script.sh
```

### استعادة النسخة الاحتياطية

```bash
#!/bin/bash
# restore-script.sh

BACKUP_FILE=$1
DB_NAME="arabic_accounting_system"
DB_USER="accounting_user"

# إيقاف الاتصالات
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';"

# حذف قاعدة البيانات
dropdb -U postgres $DB_NAME

# إنشاء قاعدة بيانات جديدة
createdb -U postgres $DB_NAME

# استعادة البيانات
gunzip -c $BACKUP_FILE | psql -U $DB_USER $DB_NAME
```

## 📈 التحسين والصيانة

### صيانة دورية

```sql
-- تحليل الجداول لتحديث الإحصائيات
ANALYZE;

-- إعادة فهرسة الجداول الكبيرة
REINDEX TABLE transactions;
REINDEX TABLE activity_logs;

-- تنظيف البيانات القديمة
DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '6 months';
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '3 months' AND is_read = true;
```

### مراقبة المساحة

```sql
-- حجم قاعدة البيانات
SELECT pg_size_pretty(pg_database_size('arabic_accounting_system'));

-- أكبر الجداول
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(table_name::regclass)) as size
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_name::regclass) DESC;
```

## 🔗 التكامل مع التطبيق

### مثال على Connection Pool في Node.js

```javascript
const { Pool } = require('pg');

const pool = new Pool({
    user: 'accounting_user',
    host: 'localhost',
    database: 'arabic_accounting_system',
    password: 'secure_password',
    port: 5432,
    max: 20, // أقصى عدد اتصالات
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// استخدام Pool
async function getTransactions() {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM transactions ORDER BY date DESC LIMIT 10');
        return result.rows;
    } finally {
        client.release();
    }
}
```

### مثال على API Endpoints

```javascript
// Express.js routes
app.get('/api/projects', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, 
                   COUNT(t.id) as transaction_count,
                   COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income
            FROM projects p
            LEFT JOIN transactions t ON p.id = t.project_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/transactions', async (req, res) => {
    const { date, type, amount, description, project_id, expense_type_id } = req.body;
    
    try {
        const result = await pool.query(`
            INSERT INTO transactions (date, type, amount, description, project_id, expense_type_id, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [date, type, amount, description, project_id, expense_type_id, req.user.id]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## 📱 التكامل مع التطبيقات المحمولة

### API Authentication

```javascript
const jwt = require('jsonwebtoken');

// إنشاء JWT Token
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
}

// middleware للتحقق من Token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}
```

## 🌐 النشر والإنتاج

### Docker Setup

```dockerfile
# Dockerfile for PostgreSQL
FROM postgres:15

ENV POSTGRES_DB=arabic_accounting_system
ENV POSTGRES_USER=accounting_user
ENV POSTGRES_PASSWORD=secure_password

COPY complete-database-schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY sample-data.sql /docker-entrypoint-initdb.d/02-data.sql

EXPOSE 5432
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    build: .
    environment:
      POSTGRES_DB: arabic_accounting_system
      POSTGRES_USER: accounting_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    networks:
      - accounting_network

  app:
    build: ./app
    environment:
      DATABASE_URL: postgresql://accounting_user:${DB_PASSWORD}@postgres:5432/arabic_accounting_system
    depends_on:
      - postgres
    ports:
      - "3000:3000"
    networks:
      - accounting_network

volumes:
  postgres_data:

networks:
  accounting_network:
    driver: bridge
```

## 📋 قائمة المراجعة للنشر

### ✅ قبل النشر

- [ ] تغيير كلمات المرور الافتراضية
- [ ] تفعيل SSL/TLS للاتصالات
- [ ] إعداد النسخ الاحتياطي التلقائي
- [ ] اختبار عمليات الاستعادة
- [ ] تحديد صلاحيات المستخدمين
- [ ] مراجعة إعدادات الأمان
- [ ] إعداد مراقبة الأداء
- [ ] اختبار جميع API endpoints
- [ ] مراجعة السعة والأداء
- [ ] إعداد نظام التنبيهات

### ✅ بعد النشر

- [ ] مراقبة الأداء والأخطاء
- [ ] تحديث الفهارس حسب الحاجة
- [ ] صيانة دورية للقاعدة
- [ ] مراجعة أمان البيانات
- [ ] تحديث النسخ الاحتياطية
- [ ] مراقبة استهلاك الموارد
- [ ] تحديث الوثائق
- [ ] تدريب المستخدمين
- [ ] جمع ملاحظات المستخدمين
- [ ] تخطيط التحديثات المستقبلية

---

## 📞 الدعم والصيانة

للحصول على الدعم أو الإبلاغ عن مشاكل:
- مراجعة سجلات قاعدة البيانات: `/var/log/postgresql/`
- مراقبة الأداء: استخدام `pg_stat_statements`
- تحليل الاستعلامات البطيئة: `EXPLAIN ANALYZE`

هذا النظام مصمم ليكون قابلاً للتوسع والتطوير حسب احتياجات مؤسستك.
