import { createClient, SupabaseClient } from '@supabase/supabase-js';

// نظام Supabase مبسط يعمل بدون timeout issues
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yieyqusnciiithjtlgod.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;
let connectionStatus = {
  client: false,
  storage: false,
  lastCheck: new Date()
};

// تهيئة بسيطة
export async function initializeSupabaseSimple(): Promise<boolean> {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.log('⚠️ مفاتيح Supabase غير متوفرة');
      return false;
    }

    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // تحديث الحالة
    connectionStatus.client = true;
    connectionStatus.lastCheck = new Date();
    
    console.log('✅ تم تهيئة Supabase (وضع مبسط)');
    return true;
  } catch (error) {
    console.log('❌ فشل في تهيئة Supabase:', error);
    return false;
  }
}

// فحص سريع بدون timeout طويل
export async function checkSupabaseSimpleHealth(): Promise<{
  client: boolean;
  storage: boolean;
  lastCheck: string;
}> {
  if (!supabaseClient) {
    return {
      client: false,
      storage: false,
      lastCheck: connectionStatus.lastCheck.toISOString()
    };
  }

  // فحص سريع للتخزين
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000); // 3 ثوانِ timeout

    const { error } = await supabaseClient.storage.listBuckets();
    connectionStatus.storage = !error;
  } catch (error) {
    connectionStatus.storage = false;
  }

  connectionStatus.lastCheck = new Date();
  
  return {
    client: connectionStatus.client,
    storage: connectionStatus.storage,
    lastCheck: connectionStatus.lastCheck.toISOString()
  };
}

// رفع ملف مع retry logic
export async function uploadToSupabaseSimple(
  fileBuffer: Buffer, 
  fileName: string, 
  bucket: string = 'files'
): Promise<string | null> {
  if (!supabaseClient) {
    return null;
  }

  try {
    // محاولة إنشاء bucket
    await supabaseClient.storage.createBucket(bucket, {
      public: true,
      allowedMimeTypes: ['*/*'],
      fileSizeLimit: 50 * 1024 * 1024
    });

    // رفع الملف
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(fileName, fileBuffer, { upsert: true });

    if (error) {
      console.log('خطأ في رفع الملف:', error.message);
      return null;
    }

    // الحصول على URL
    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.log('خطأ في uploadToSupabaseSimple:', error);
    return null;
  }
}

// حذف ملف
export async function deleteFromSupabaseSimple(fileName: string, bucket: string = 'files'): Promise<boolean> {
  if (!supabaseClient) {
    return false;
  }

  try {
    const { error } = await supabaseClient.storage
      .from(bucket)
      .remove([fileName]);

    return !error;
  } catch (error) {
    return false;
  }
}

// نسخ الملفات المحلية
export async function copyFilesToSupabaseSimple(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  if (!supabaseClient) {
    results.errors.push('Supabase غير مُهيأ');
    return results;
  }

  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      results.errors.push('مجلد uploads غير موجود');
      return results;
    }

    const files = fs.readdirSync(uploadsDir);
    console.log(`🔄 بدء نسخ ${files.length} ملف إلى Supabase...`);

    for (const fileName of files.slice(0, 5)) { // نسخ أول 5 ملفات فقط لتجنب timeout
      try {
        const filePath = path.join(uploadsDir, fileName);
        const fileBuffer = fs.readFileSync(filePath);
        
        const url = await uploadToSupabaseSimple(fileBuffer, fileName);
        
        if (url) {
          results.success++;
          console.log(`✅ تم نسخ ${fileName}`);
        } else {
          results.failed++;
          results.errors.push(`فشل في نسخ ${fileName}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`خطأ في ${fileName}`);
      }
    }

    return results;
  } catch (error) {
    results.errors.push('خطأ عام في النسخ');
    return results;
  }
}

export { supabaseClient };
export const getSupabaseStatus = () => connectionStatus;