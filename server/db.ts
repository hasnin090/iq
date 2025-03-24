// استيراد المكتبات اللازمة
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// إنشاء اتصال قاعدة البيانات
const sql = neon(process.env.DATABASE_URL!);
// إصلاح مشكلة الأنواع باستخدام as any
export const db = drizzle(sql as any, { schema });

// تصدير أنواع البيانات من المخطط
export * from '../shared/schema';