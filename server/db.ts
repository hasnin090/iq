// استيراد المكتبات اللازمة
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import Database from 'better-sqlite3';
import * as schema from '../shared/schema';

// طباعة معلومات الاتصال للتصحيح
console.log(`Database mode: ${process.env.USE_SQLITE === 'true' ? 'SQLite' : 'PostgreSQL'}`);

let db: any;

// التحقق من وضع قاعدة البيانات - أولوية لـ Supabase
if (process.env.DATABASE_URL?.startsWith('postgresql:') && process.env.USE_SQLITE !== 'true') {
  // استخدام PostgreSQL/Supabase كأولوية
  try {
    const sql = neon(process.env.DATABASE_URL);
    db = drizzleNeon(sql, { schema });
    console.log('✅ Using PostgreSQL/Supabase database');
    console.log('🔗 Database URL:', process.env.DATABASE_URL.substring(0, 50) + '...');
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL/Supabase:', (error as Error).message);
    console.log('🔄 Falling back to SQLite...');
    const sqlite = new Database('./database.db');
    db = drizzle(sqlite, { schema });
    console.log('✅ Using fallback SQLite database');
  }
} else if (process.env.USE_SQLITE === 'true') {
  // استخدام SQLite عند التفعيل الصريح فقط
  const sqliteUrl = process.env.SQLITE_DATABASE_PATH || './database.db';
  const sqlite = new Database(sqliteUrl);
  db = drizzle(sqlite, { schema });
  console.log('✅ Using SQLite database (forced by USE_SQLITE=true)');
} else {
  // في حالة عدم وجود إعداد صحيح، استخدم SQLite كافتراضي
  console.warn('⚠️ No valid database configuration found, using fallback SQLite');
  const sqlite = new Database('./database.db');
  db = drizzle(sqlite, { schema });
  console.log('✅ Using fallback SQLite database');
}

export { db };

// تصدير أنواع البيانات من المخطط
export * from '../shared/schema';