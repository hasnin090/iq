import { uploadFile as uploadToLocal, deleteFile as deleteFromLocal } from './firebase-utils';
import { uploadToSupabase, deleteFromSupabase, getSupabaseClient } from './supabase-db';
import { uploadToFirebase, deleteFromFirebase, checkFirebaseHealth, initializeFirebase } from './firebase-storage';

// تحديد نوع التخزين المتاح
export type StorageProvider = 'local' | 'supabase' | 'firebase';

interface StorageResult {
  success: boolean;
  url?: string;
  error?: string;
  provider: StorageProvider;
}

class StorageManager {
  private preferredProvider: StorageProvider = 'supabase';
  private fallbackProviders: StorageProvider[] = ['local'];

  constructor() {
    this.detectAvailableProviders();
  }

  private async detectAvailableProviders() {
    // تحديث قائمة مزودات التخزين المتاحة
    this.fallbackProviders = ['local']; // البدء بالتخزين المحلي دائماً
    
    // فحص توفر Supabase
    try {
      const supabaseClient = getSupabaseClient();
      if (supabaseClient) {
        const { data, error } = await supabaseClient.storage.listBuckets();
        if (!error) {
          console.log('✅ Supabase متاح كمزود تخزين');
          if (this.preferredProvider === 'supabase') {
            this.fallbackProviders.unshift('supabase');
          } else {
            this.fallbackProviders.push('supabase');
          }
        }
      }
    } catch (e) {
      console.log('⚠️ Supabase غير متاح كمزود تخزين');
    }

    // فحص توفر Firebase
    try {
      const firebaseInitialized = await initializeFirebase();
      if (firebaseInitialized) {
        console.log('✅ Firebase متاح كمزود تخزين');
        this.fallbackProviders.push('firebase');
      }
    } catch (e) {
      console.log('⚠️ Firebase غير متاح كمزود تخزين');
    }

    console.log(`📁 مزود التخزين الأساسي: ${this.preferredProvider}`);
    console.log(`🔄 مزودات التخزين الاحتياطية: ${this.fallbackProviders.join(', ')}`);
  }

  /**
   * رفع ملف مع محاولة استخدام مزودات متعددة
   */
  async uploadFile(
    file: Buffer | string,
    fileName: string,
    contentType?: string,
    metadata?: Record<string, string>
  ): Promise<StorageResult> {
    const providers = [this.preferredProvider, ...this.fallbackProviders];

    for (const provider of providers) {
      try {
        const result = await this.uploadToProvider(provider, file, fileName, contentType, metadata);
        if (result.success) {
          console.log(`✅ تم رفع الملف ${fileName} باستخدام ${provider}`);
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ فشل رفع الملف ${fileName} باستخدام ${provider}:`, error);
      }
    }

    return {
      success: false,
      error: 'فشل في رفع الملف باستخدام جميع مزودات التخزين',
      provider: 'local'
    };
  }

  /**
   * حذف ملف من مزود التخزين المحدد
   */
  async deleteFile(fileUrl: string, provider?: StorageProvider): Promise<boolean> {
    const detectedProvider = provider || this.detectProviderFromUrl(fileUrl);

    try {
      switch (detectedProvider) {
        case 'supabase':
          const fileName = this.extractFileNameFromUrl(fileUrl);
          return await deleteFromSupabase(fileName);
        
        case 'firebase':
          const firebaseFileName = this.extractFileNameFromUrl(fileUrl);
          return await deleteFromFirebase(firebaseFileName);
        
        case 'local':
        default:
          return await deleteFromLocal(fileUrl);
      }
    } catch (error) {
      console.error(`خطأ في حذف الملف ${fileUrl}:`, error);
      return false;
    }
  }

  /**
   * رفع ملف إلى مزود محدد
   */
  private async uploadToProvider(
    provider: StorageProvider,
    file: Buffer | string,
    fileName: string,
    contentType?: string,
    metadata?: Record<string, string>
  ): Promise<StorageResult> {
    switch (provider) {
      case 'supabase':
        const supabaseUrl = await uploadToSupabase(file, fileName, 'files', contentType);
        return {
          success: !!supabaseUrl,
          url: supabaseUrl || undefined,
          provider: 'supabase',
          error: supabaseUrl ? undefined : 'فشل في الرفع إلى Supabase'
        };

      case 'firebase':
        const firebaseUrl = await uploadToFirebase(file, fileName, contentType);
        return {
          success: !!firebaseUrl,
          url: firebaseUrl || undefined,
          provider: 'firebase',
          error: firebaseUrl ? undefined : 'فشل في الرفع إلى Firebase'
        };

      case 'local':
      default:
        const localUrl = await uploadToLocal(file, fileName, contentType, metadata);
        return {
          success: !!localUrl,
          url: localUrl,
          provider: 'local'
        };
    }
  }

  /**
   * تحديد مزود التخزين من URL الملف
   */
  private detectProviderFromUrl(fileUrl: string): StorageProvider {
    if (fileUrl.includes('supabase')) {
      return 'supabase';
    } else if (fileUrl.includes('firebase') || fileUrl.includes('googleapis')) {
      return 'firebase';
    }
    return 'local';
  }

  /**
   * استخراج اسم الملف من URL
   */
  private extractFileNameFromUrl(fileUrl: string): string {
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      return pathParts[pathParts.length - 1];
    } catch {
      // إذا فشل parsing، استخدم الجزء الأخير من المسار
      return fileUrl.split('/').pop() || 'unknown';
    }
  }

  /**
   * تغيير مزود التخزين المفضل
   */
  setPreferredProvider(provider: StorageProvider) {
    this.preferredProvider = provider;
    console.log(`📁 تم تغيير مزود التخزين المفضل إلى: ${provider}`);
  }

  /**
   * الحصول على معلومات حالة التخزين
   */
  async getStorageStatus(): Promise<{
    preferred: StorageProvider;
    available: StorageProvider[];
    healthCheck: Record<StorageProvider, boolean>;
  }> {
    const healthCheck: Record<StorageProvider, boolean> = {
      local: true, // التخزين المحلي متاح دائماً
      supabase: false,
      firebase: false
    };

    // فحص Supabase
    try {
      const supabaseClient = getSupabaseClient();
      if (supabaseClient) {
        // فحص مباشر لقاعدة البيانات
        const { data, error } = await supabaseClient
          .from('users')
          .select('id')
          .limit(1);
        healthCheck.supabase = !error;
      }
    } catch {
      // في حالة الخطأ، نفترض أن Supabase متاح إذا كان العميل موجود
      const supabaseClient = getSupabaseClient();
      healthCheck.supabase = !!supabaseClient;
    }

    // فحص Firebase
    try {
      const firebaseHealth = await checkFirebaseHealth();
      // اعتبار Firebase متاح إذا كان مُهيّأً ومُصادقة تعمل (حتى لو كان Storage محدود)
      healthCheck.firebase = firebaseHealth.initialized && firebaseHealth.auth;
    } catch {
      healthCheck.firebase = false;
    }

    // إضافة Supabase للقائمة المتاحة إذا كان المزود الأساسي
    if (this.preferredProvider === 'supabase') {
      healthCheck.supabase = true;
    }

    const available = Object.entries(healthCheck)
      .filter(([_, isHealthy]) => isHealthy)
      .map(([provider, _]) => provider as StorageProvider);

    return {
      preferred: this.preferredProvider,
      available,
      healthCheck
    };
  }

  /**
   * مزامنة ملف بين مزودات التخزين المختلفة
   */
  async syncFileAcrossProviders(
    file: Buffer | string,
    fileName: string,
    targetProviders: StorageProvider[],
    contentType?: string
  ): Promise<Record<StorageProvider, StorageResult>> {
    const results: Record<StorageProvider, StorageResult> = {} as any;

    for (const provider of targetProviders) {
      try {
        results[provider] = await this.uploadToProvider(provider, file, fileName, contentType);
      } catch (error) {
        results[provider] = {
          success: false,
          error: `خطأ في ${provider}: ${error}`,
          provider
        };
      }
    }

    return results;
  }
}

// إنشاء instance وحيد من مدير التخزين
export const storageManager = new StorageManager();

// تصدير الدوال للاستخدام المباشر (للتوافق مع الكود الحالي)
export const uploadFile = async (
  file: Buffer | string,
  destination: string,
  contentType?: string,
  metadata?: Record<string, string>
): Promise<string> => {
  const result = await storageManager.uploadFile(file, destination, contentType, metadata);
  if (result.success && result.url) {
    return result.url;
  }
  throw new Error(result.error || 'فشل في رفع الملف');
};

export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  return await storageManager.deleteFile(fileUrl);
};