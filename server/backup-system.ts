import { db } from './db';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { storage } from './storage';

export class BackupSystem {
  private backupDir = path.join(process.cwd(), 'backups');
  private maxBackups = 30; // الاحتفاظ بـ 30 نسخة احتياطية

  constructor() {
    // إنشاء مجلد النسخ الاحتياطي إذا لم يكن موجوداً
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // إنشاء نسخة احتياطية كاملة
  async createFullBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.json`;
      const filepath = path.join(this.backupDir, filename);

      // جمع جميع البيانات
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
          users: await storage.listUsers(),
          projects: await storage.listProjects(),
          transactions: await storage.listTransactions(),
          documents: await storage.listDocuments(),
          settings: await storage.listSettings(),
          funds: await storage.listFunds(),
          activityLogs: await storage.listActivityLogs()
        }
      };

      // إزالة كلمات المرور من النسخة الاحتياطية لأغراض الأمان
      backupData.data.users = backupData.data.users.map(user => ({
        ...user,
        password: '[ENCRYPTED]'
      }));

      // كتابة الملف
      writeFileSync(filepath, JSON.stringify(backupData, null, 2));

      // تنظيف النسخ القديمة
      await this.cleanOldBackups();

      console.log(`تم إنشاء نسخة احتياطية: ${filename}`);
      return filename;
    } catch (error) {
      console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
      throw error;
    }
  }

  // تنظيف النسخ الاحتياطية القديمة
  private async cleanOldBackups(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .sort()
        .reverse();

      // حذف النسخ الزائدة
      if (backupFiles.length > this.maxBackups) {
        const filesToDelete = backupFiles.slice(this.maxBackups);
        for (const file of filesToDelete) {
          await fs.unlink(path.join(this.backupDir, file));
          console.log(`تم حذف النسخة الاحتياطية القديمة: ${file}`);
        }
      }
    } catch (error) {
      console.error('خطأ في تنظيف النسخ الاحتياطية:', error);
    }
  }

  // جدولة النسخ الاحتياطي التلقائي
  startAutoBackup(): void {
    // نسخة احتياطية كل 24 ساعة
    const backupInterval = 24 * 60 * 60 * 1000; // 24 ساعة بالميلي ثانية

    setInterval(async () => {
      try {
        await this.createFullBackup();
        console.log('تم إجراء النسخ الاحتياطي التلقائي بنجاح');
      } catch (error) {
        console.error('فشل في النسخ الاحتياطي التلقائي:', error);
      }
    }, backupInterval);

    // إنشاء أول نسخة احتياطية عند بدء النظام
    setTimeout(async () => {
      try {
        await this.createFullBackup();
        console.log('تم إنشاء النسخة الاحتياطية الأولى عند بدء النظام');
      } catch (error) {
        console.error('فشل في إنشاء النسخة الاحتياطية الأولى:', error);
      }
    }, 5000); // بعد 5 ثوانِ من بدء النظام

    console.log('تم تفعيل النسخ الاحتياطي التلقائي (كل 24 ساعة)');
  }

  // إنشاء نسخة احتياطية طوارئ قبل العمليات الحساسة
  async createEmergencyBackup(operation: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `emergency-${operation}-${timestamp}.json`;
      const filepath = path.join(this.backupDir, filename);

      const backupData = {
        timestamp: new Date().toISOString(),
        type: 'emergency',
        operation: operation,
        version: '1.0.0',
        data: {
          users: await storage.listUsers(),
          projects: await storage.listProjects(),
          transactions: await storage.listTransactions(),
          documents: await storage.listDocuments(),
          settings: await storage.listSettings(),
          funds: await storage.listFunds()
        }
      };

      // إزالة كلمات المرور
      backupData.data.users = backupData.data.users.map(user => ({
        ...user,
        password: '[ENCRYPTED]'
      }));

      writeFileSync(filepath, JSON.stringify(backupData, null, 2));
      console.log(`تم إنشاء نسخة احتياطية طوارئ: ${filename}`);
      return filename;
    } catch (error) {
      console.error('خطأ في إنشاء نسخة احتياطية طوارئ:', error);
      throw error;
    }
  }

  // الحصول على قائمة النسخ الاحتياطية المتاحة
  async getAvailableBackups(): Promise<Array<{name: string, date: Date, size: number}>> {
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(this.backupDir);
      const backupFiles = [];

      for (const file of files) {
        if (file.endsWith('.json') && (file.startsWith('backup-') || file.startsWith('emergency-'))) {
          const filepath = path.join(this.backupDir, file);
          const stats = await fs.stat(filepath);
          backupFiles.push({
            name: file,
            date: stats.mtime,
            size: stats.size
          });
        }
      }

      return backupFiles.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('خطأ في جلب قائمة النسخ الاحتياطية:', error);
      return [];
    }
  }
}

// إنشاء مثيل واحد للنظام
export const backupSystem = new BackupSystem();