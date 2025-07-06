const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// إنشاء قاعدة البيانات المحلية
const sqlite = new Database('./local.db');

console.log('🚀 إعداد قاعدة البيانات المحلية...');

try {
  // إنشاء جدول المستخدمين
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // إنشاء جدول المشاريع
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // إنشاء جدول المعاملات
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      project_id INTEGER,
      user_id INTEGER,
      attachment_url TEXT,
      attachment_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // إنشاء جدول الجلسات
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire DATETIME NOT NULL
    )
  `);

  console.log('✅ تم إنشاء الجداول بنجاح');

  // إنشاء مستخدم admin افتراضي
  const adminExists = sqlite.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    // كلمة المرور: admin123 (مشفرة)
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    sqlite.prepare(`
      INSERT INTO users (username, password, email, role)
      VALUES (?, ?, ?, ?)
    `).run('admin', hashedPassword, 'admin@example.com', 'admin');
    
    console.log('✅ تم إنشاء مستخدم admin بنجاح');
    console.log('   اسم المستخدم: admin');
    console.log('   كلمة المرور: admin123');
  } else {
    console.log('ℹ️  مستخدم admin موجود مسبقاً');
  }

  // إنشاء مشروع تجريبي
  const projectExists = sqlite.prepare('SELECT id FROM projects WHERE name = ?').get('المشروع التجريبي');
  if (!projectExists) {
    const adminId = sqlite.prepare('SELECT id FROM users WHERE username = ?').get('admin').id;
    sqlite.prepare(`
      INSERT INTO projects (name, description, created_by)
      VALUES (?, ?, ?)
    `).run('المشروع التجريبي', 'مشروع تجريبي للاختبار', adminId);
    
    console.log('✅ تم إنشاء مشروع تجريبي');
  }

  console.log('✅ تم إعداد قاعدة البيانات المحلية بنجاح');
  console.log('📁 ملف قاعدة البيانات: ./local.db');
  
} catch (error) {
  console.error('❌ خطأ في إعداد قاعدة البيانات:', error);
} finally {
  sqlite.close();
}
