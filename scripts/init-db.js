import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { users, projects, transactions } from './shared/schema-sqlite.js';

console.log('🔄 Initializing SQLite database...');

// إنشاء اتصال قاعدة البيانات
const sqlite = new Database('./database.db');
const db = drizzle(sqlite);

// إنشاء الجداول
console.log('📋 Creating tables...');

try {
  // إنشاء جدول المستخدمين
  sqlite.exec(`
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

  // إنشاء جدول المشاريع
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      budget TEXT
    );
  `);

  // إنشاء جدول المعاملات
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id),
      description TEXT NOT NULL,
      amount TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Tables created successfully!');

  // إدراج مستخدم افتراضي للاختبار
  const existingUser = sqlite.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  
  if (!existingUser) {
    sqlite.prepare(`
      INSERT INTO users (username, password, name, role, permissions) 
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', '$2b$10$8K1p/a0dqNOopX8WAjELUOxO9LVwqsYJbVGwBt7wOrT8OzEiN7AEW', 'مدير النظام', 'admin', '["manage_users","manage_projects","manage_transactions","view_reports"]');
    
    console.log('👤 Default admin user created (username: admin, password: admin123)');
  }

  console.log('🎉 Database initialization completed!');
  
} catch (error) {
  console.error('❌ Error initializing database:', error);
} finally {
  sqlite.close();
}
