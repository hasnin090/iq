import { db } from './db';
import { migrate } from "drizzle-orm/neon-http/migrator";
import { storage } from './storage';
import bcrypt from 'bcryptjs';

export async function setupDatabase() {
  try {
    console.log("بدء عملية ترحيل قاعدة البيانات...");
    await migrate(db, { migrationsFolder: './migrations' });
    console.log("تم ترحيل قاعدة البيانات بنجاح!");

    // إنشاء مستخدم افتراضي للمسؤول إذا لم يكن موجوداً
    const adminUser = await storage.getUserByUsername('admin');
    
    if (!adminUser) {
      console.log("إنشاء مستخدم المسؤول...");
      
      // تشفير كلمة المرور بمستوى حماية عالي
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await storage.createUser({
        username: 'admin',
        password: hashedPassword,
        name: 'مدير النظام',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['read', 'write', 'admin'],
        active: true
      } as any);
      
      console.log("تم إنشاء مستخدم المسؤول بنجاح!");
    }
    
    return true;
  } catch (error) {
    console.error("خطأ في إعداد قاعدة البيانات:", error);
    return false;
  }
}