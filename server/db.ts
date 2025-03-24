// استيراد المكتبات اللازمة
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// طباعة معلومات الاتصال للتصحيح (مع إخفاء البيانات الحساسة)
console.log(`Connecting to database... URL format: ${process.env.DATABASE_URL?.substring(0, 20)}...`);

// إنشاء اتصال قاعدة البيانات
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// تصدير أنواع البيانات من المخطط
export * from '../shared/schema';