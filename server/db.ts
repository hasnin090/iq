// استيراد المكتبات اللازمة
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import Database from 'better-sqlite3';
import * as schema from '../shared/schema';

// طباعة معلومات الاتصال للتصحيح
console.log(`Database mode: ${process.env.USE_SQLITE === 'true' ? 'SQLite' : 'PostgreSQL'}`);

let db: any;

// التحقق من وضع قاعدة البيانات
if (process.env.USE_SQLITE === 'true' || process.env.APP_MODE === 'development') {
  // استخدام SQLite للتطوير المحلي
  const sqliteUrl = process.env.SQLITE_DATABASE_PATH || './database.db';
  const sqlite = new Database(sqliteUrl);
  db = drizzle(sqlite, { schema });
  console.log('✅ Using SQLite database for local development');
} else if (process.env.DATABASE_URL?.startsWith('postgresql:')) {
  // استخدام PostgreSQL/Neon للإنتاج
  const sql = neon(process.env.DATABASE_URL);
  db = drizzleNeon(sql, { schema });
  console.log('✅ Using PostgreSQL/Neon database');
} else {
  // في حالة عدم وجود إعداد صحيح، استخدم SQLite كافتراضي
  console.warn('⚠️ Database configuration not found, using fallback SQLite');
  const sqlite = new Database('./database.db');
  db = drizzle(sqlite, { schema });
  console.log('✅ Using fallback SQLite database');
}

export { db };

// تصدير أنواع البيانات من المخطط
export * from '../shared/schema';