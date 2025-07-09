import { createServer } from './server/index.js';

console.log('🚀 Starting IQ Accounting System...');
console.log('📁 Current directory:', process.cwd());
console.log('🔧 Node version:', process.version);

// تهيئة قاعدة البيانات
import Database from 'better-sqlite3';

try {
  console.log('🗄️ Initializing database...');
  const db = new Database('./database.db');
  
  // إنشاء جدول المستخدمين
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      permissions TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // إدراج مستخدم افتراضي
  const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!existingUser) {
    db.prepare(`
      INSERT INTO users (username, password, name, role, permissions) 
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', '$2b$10$8K1p/a0dqNOopX8WAjELUOxO9LVwqsYJbVGwBt7wOrT8OzEiN7AEW', 'مدير النظام', 'admin', '["manage_users","manage_projects","manage_transactions","view_reports"]');
    
    console.log('👤 Admin user created: admin / admin123');
  }

  db.close();
  console.log('✅ Database initialized successfully!');

  // تشغيل الخادم
  createServer();
  
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
