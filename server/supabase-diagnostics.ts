import { createClient } from '@supabase/supabase-js';

// تشخيص مفصل لاتصال Supabase
export async function diagnoseSupabaseConnection() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const results = {
    url: !!SUPABASE_URL,
    anonKey: !!SUPABASE_ANON_KEY,
    serviceKey: !!SUPABASE_SERVICE_KEY,
    urlFormat: false,
    anonKeyTest: false,
    serviceKeyTest: false,
    databaseAccess: false,
    storageAccess: false,
    errors: [] as string[]
  };

  // فحص تنسيق URL
  if (SUPABASE_URL) {
    results.urlFormat = SUPABASE_URL.includes('supabase.co') || SUPABASE_URL.includes('localhost');
  }

  // اختبار المفتاح العام
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { error } = await anonClient.from('test').select('*').limit(1);
      
      if (!error || error.message.includes('relation "test" does not exist')) {
        results.anonKeyTest = true;
      } else {
        results.errors.push(`مفتاح عام: ${error.message}`);
      }
    } catch (error: any) {
      results.errors.push(`خطأ مفتاح عام: ${error.message}`);
    }
  }

  // اختبار مفتاح الخدمة
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      // اختبار قاعدة البيانات
      const { error: dbError } = await serviceClient
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);
      
      if (!dbError) {
        results.databaseAccess = true;
        results.serviceKeyTest = true;
      } else {
        results.errors.push(`قاعدة بيانات: ${dbError.message}`);
      }

      // اختبار التخزين
      const { error: storageError } = await serviceClient.storage.listBuckets();
      
      if (!storageError) {
        results.storageAccess = true;
      } else {
        results.errors.push(`تخزين: ${storageError.message}`);
      }
    } catch (error: any) {
      results.errors.push(`خطأ مفتاح خدمة: ${error.message}`);
    }
  }

  return results;
}

// اقتراح الحلول بناءً على التشخيص
export function getSuggestions(diagnosis: any) {
  const suggestions = [];

  if (!diagnosis.url) {
    suggestions.push('تحقق من متغير SUPABASE_URL في إعدادات البيئة');
  }

  if (!diagnosis.urlFormat) {
    suggestions.push('تأكد من أن رابط Supabase صحيح (يجب أن ينتهي بـ .supabase.co)');
  }

  if (!diagnosis.anonKey) {
    suggestions.push('أضف متغير SUPABASE_ANON_KEY');
  }

  if (!diagnosis.serviceKey) {
    suggestions.push('أضف متغير SUPABASE_SERVICE_ROLE_KEY للوصول الكامل');
  }

  if (!diagnosis.anonKeyTest) {
    suggestions.push('تحقق من صحة مفتاح anon - قد يكون منتهي الصلاحية');
  }

  if (!diagnosis.serviceKeyTest) {
    suggestions.push('تحقق من صحة مفتاح service_role - مطلوب للوصول الإداري');
  }

  if (!diagnosis.databaseAccess) {
    suggestions.push('تفعيل Row Level Security في Supabase أو استخدام service_role key');
  }

  if (!diagnosis.storageAccess) {
    suggestions.push('تفعيل Supabase Storage في مشروعك أو التحقق من صلاحيات التخزين');
  }

  return suggestions;
}