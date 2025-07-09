// دعني أنشئ فحص بسيط بدون import لأن المكتبات لا تعمل حالياً
// سنستخدم fetch API المدمج في Node.js

// تحميل متغيرات البيئة
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yieyqusnciiithjtlgod.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_DATABASE_URL = process.env.SUPABASE_DATABASE_URL;

interface HealthCheck {
  component: string;
  status: 'OK' | 'ERROR' | 'WARNING';
  message: string;
  details?: any;
}

async function checkSupabaseConnection(): Promise<HealthCheck[]> {
  const results: HealthCheck[] = [];
  
  console.log('🔍 فحص اتصال Supabase...\n');
  
  // 1. فحص متغيرات البيئة
  console.log('1️⃣ فحص متغيرات البيئة:');
  
  if (!SUPABASE_URL) {
    results.push({
      component: 'Environment Variables',
      status: 'ERROR',
      message: 'SUPABASE_URL غير موجود'
    });
  } else {
    console.log(`   ✅ SUPABASE_URL: ${SUPABASE_URL}`);
    results.push({
      component: 'SUPABASE_URL',
      status: 'OK',
      message: 'متوفر'
    });
  }
  
  if (!SUPABASE_ANON_KEY) {
    results.push({
      component: 'Environment Variables',
      status: 'ERROR',
      message: 'SUPABASE_ANON_KEY غير موجود'
    });
  } else {
    console.log(`   ✅ SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
    results.push({
      component: 'SUPABASE_ANON_KEY',
      status: 'OK',
      message: 'متوفر'
    });
  }
  
  if (SUPABASE_SERVICE_ROLE_KEY) {
    console.log(`   ✅ SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
    results.push({
      component: 'SUPABASE_SERVICE_ROLE_KEY',
      status: 'OK',
      message: 'متوفر'
    });
  } else {
    console.log(`   ⚠️  SUPABASE_SERVICE_ROLE_KEY: غير موجود`);
    results.push({
      component: 'SUPABASE_SERVICE_ROLE_KEY',
      status: 'WARNING',
      message: 'غير موجود (قد يؤثر على بعض العمليات)'
    });
  }
  
  if (SUPABASE_DATABASE_URL) {
    console.log(`   ✅ SUPABASE_DATABASE_URL: متوفر`);
    results.push({
      component: 'SUPABASE_DATABASE_URL',
      status: 'OK',
      message: 'متوفر'
    });
  } else {
    console.log(`   ⚠️  SUPABASE_DATABASE_URL: غير موجود`);
    results.push({
      component: 'SUPABASE_DATABASE_URL',
      status: 'WARNING',
      message: 'غير موجود (سيتم استخدام API فقط)'
    });
  }
  
  console.log('\n');
  
  // 2. فحص اتصال العميل (Client)
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    console.log('2️⃣ فحص اتصال العميل:');
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      // فحص اتصال بسيط
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        console.log(`   ❌ فشل اتصال العميل: ${error.message}`);
        results.push({
          component: 'Supabase Client',
          status: 'ERROR',
          message: `فشل الاتصال: ${error.message}`,
          details: error
        });
      } else {
        console.log(`   ✅ اتصال العميل يعمل بنجاح`);
        results.push({
          component: 'Supabase Client',
          status: 'OK',
          message: 'الاتصال يعمل بنجاح'
        });
      }
    } catch (error) {
      console.log(`   ❌ خطأ في اتصال العميل: ${error.message}`);
      results.push({
        component: 'Supabase Client',
        status: 'ERROR',
        message: `خطأ في الاتصال: ${error.message}`,
        details: error
      });
    }
    console.log('\n');
  }
  
  // 3. فحص اتصال قاعدة البيانات المباشر
  if (SUPABASE_DATABASE_URL) {
    console.log('3️⃣ فحص اتصال قاعدة البيانات المباشر:');
    let connection = null;
    try {
      connection = postgres(SUPABASE_DATABASE_URL, {
        connect_timeout: 10,
        ssl: 'require',
        max: 1
      });
      
      // اختبار اتصال بسيط
      await connection`SELECT 1`;
      console.log(`   ✅ اتصال قاعدة البيانات المباشر يعمل`);
      results.push({
        component: 'Direct Database Connection',
        status: 'OK',
        message: 'الاتصال المباشر يعمل بنجاح'
      });
    } catch (error) {
      console.log(`   ❌ فشل اتصال قاعدة البيانات المباشر: ${error.message}`);
      results.push({
        component: 'Direct Database Connection',
        status: 'ERROR',
        message: `فشل الاتصال المباشر: ${error.message}`,
        details: error
      });
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (e) {
          // تجاهل أخطاء الإغلاق
        }
      }
    }
    console.log('\n');
  }
  
  // 4. فحص Storage
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    console.log('4️⃣ فحص Storage:');
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      // فحص قائمة buckets
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.log(`   ❌ فشل الوصول إلى Storage: ${error.message}`);
        results.push({
          component: 'Supabase Storage',
          status: 'ERROR',
          message: `فشل الوصول: ${error.message}`,
          details: error
        });
      } else {
        console.log(`   ✅ Storage يعمل، عدد الـ buckets: ${buckets?.length || 0}`);
        if (buckets && buckets.length > 0) {
          console.log(`   📁 Buckets متوفرة: ${buckets.map(b => b.name).join(', ')}`);
        }
        results.push({
          component: 'Supabase Storage',
          status: 'OK',
          message: `Storage يعمل، ${buckets?.length || 0} buckets متوفرة`,
          details: buckets
        });
      }
    } catch (error) {
      console.log(`   ❌ خطأ في فحص Storage: ${error.message}`);
      results.push({
        component: 'Supabase Storage',
        status: 'ERROR',
        message: `خطأ في الفحص: ${error.message}`,
        details: error
      });
    }
    console.log('\n');
  }
  
  return results;
}

// تشغيل الفحص
async function main() {
  console.log('🚀 بدء فحص اتصال Supabase\n');
  console.log('=' * 50);
  
  const results = await checkSupabaseConnection();
  
  console.log('📊 ملخص النتائج:');
  console.log('=' * 50);
  
  const okCount = results.filter(r => r.status === 'OK').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;
  
  console.log(`✅ يعمل بشكل صحيح: ${okCount}`);
  console.log(`⚠️  تحذيرات: ${warningCount}`);
  console.log(`❌ أخطاء: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n🔥 المشاكل التي تحتاج إصلاح:');
    results.filter(r => r.status === 'ERROR').forEach(r => {
      console.log(`   - ${r.component}: ${r.message}`);
    });
  }
  
  if (warningCount > 0) {
    console.log('\n⚠️  تحذيرات:');
    results.filter(r => r.status === 'WARNING').forEach(r => {
      console.log(`   - ${r.component}: ${r.message}`);
    });
  }
  
  console.log('\n' + '=' * 50);
  console.log('✨ انتهى الفحص');
  
  // إرجاع كود الخروج المناسب
  process.exit(errorCount > 0 ? 1 : 0);
}

// تشغيل الفحص
if (require.main === module) {
  main().catch(error => {
    console.error('💥 خطأ في تشغيل فحص الاتصال:', error);
    process.exit(1);
  });
}

export { checkSupabaseConnection };
