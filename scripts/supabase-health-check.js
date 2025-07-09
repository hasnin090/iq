// فحص اتصال Supabase مبسط وشامل
const SUPABASE_URL = 'https://yieyqusnciiithjtlgod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMjA2MDQsImV4cCI6MjA1MDg5NjYwNH0.LUhEbdl2r0yRlQrHWzpJhvYLXhqLTfPc9W_3yVPc23s';

console.log('🔍 فحص اتصال Supabase...\n');

// فحص الاتصال العام
async function checkInternetConnection() {
  console.log('1️⃣ فحص الاتصال بالإنترنت:');
  
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      console.log('   ✅ الاتصال بالإنترنت يعمل');
      return true;
    } else {
      console.log('   ❌ مشكلة في الاتصال بالإنترنت');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ لا يوجد اتصال بالإنترنت: ${error.message}`);
    return false;
  }
}

// فحص الوصول لموقع Supabase
async function checkSupabaseAccess() {
  console.log('\n2️⃣ فحص الوصول لموقع Supabase:');
  console.log(`   URL: ${SUPABASE_URL}`);
  
  try {
    const response = await fetch(SUPABASE_URL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`   حالة الاستجابة: ${response.status} ${response.statusText}`);
    
    if (response.status < 400) {
      console.log('   ✅ موقع Supabase متاح');
      return true;
    } else {
      console.log('   ❌ موقع Supabase غير متاح');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في الوصول لموقع Supabase: ${error.message}`);
    
    if (error.name === 'AbortError') {
      console.log('   💡 انتهت مهلة الانتظار - قد تكون هناك مشكلة في الشبكة');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('   💡 لا يمكن العثور على الخادم - تحقق من DNS');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('   💡 الخادم رفض الاتصال');
    }
    
    return false;
  }
}

// فحص REST API
async function checkSupabaseAPI() {
  console.log('\n3️⃣ فحص Supabase REST API:');
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/`;
    console.log(`   API URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`   حالة الاستجابة: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type') || 'غير محدد'}`);
    
    if (response.ok) {
      console.log('   ✅ REST API يعمل بشكل صحيح');
      return true;
    } else if (response.status === 401) {
      console.log('   ❌ مشكلة في المصادقة - تحقق من ANON_KEY');
      console.log(`   ANON_KEY المستخدم: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
      return false;
    } else if (response.status === 403) {
      console.log('   ❌ ممنوع الوصول - مشكلة في الأذونات');
      return false;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ REST API لا يعمل: ${errorText.substring(0, 100)}...`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في REST API: ${error.message}`);
    return false;
  }
}

// فحص الجداول
async function checkDatabaseTables() {
  console.log('\n4️⃣ فحص الوصول لجداول قاعدة البيانات:');
  
  const tables = ['users', 'projects', 'transactions', 'documents'];
  let workingTables = [];
  
  for (const table of tables) {
    try {
      console.log(`   فحص جدول ${table}...`);
      
      const url = `${SUPABASE_URL}/rest/v1/${table}?limit=1`;
      const response = await fetch(url, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ جدول ${table} متاح (${Array.isArray(data) ? data.length : 0} سجل)`);
        workingTables.push(table);
      } else {
        console.log(`   ❌ جدول ${table} غير متاح (${response.status})`);
      }
    } catch (error) {
      console.log(`   ❌ خطأ في فحص جدول ${table}: ${error.message}`);
    }
  }
  
  console.log(`\n   📊 الجداول المتاحة: ${workingTables.length}/${tables.length}`);
  if (workingTables.length > 0) {
    console.log(`   الجداول العاملة: ${workingTables.join(', ')}`);
  }
  
  return workingTables.length > 0;
}

// فحص Storage
async function checkSupabaseStorage() {
  console.log('\n5️⃣ فحص Supabase Storage:');
  
  try {
    const url = `${SUPABASE_URL}/storage/v1/bucket`;
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      signal: AbortSignal.timeout(5000)
    });
    
    console.log(`   حالة الاستجابة: ${response.status}`);
    
    if (response.ok) {
      const buckets = await response.json();
      console.log('   ✅ Storage متاح');
      
      if (Array.isArray(buckets) && buckets.length > 0) {
        console.log(`   عدد الـ buckets: ${buckets.length}`);
        console.log(`   الـ buckets: ${buckets.map(b => b.name).join(', ')}`);
      } else {
        console.log('   لا توجد buckets مُعرَّفة');
      }
      return true;
    } else {
      console.log('   ❌ Storage غير متاح');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في فحص Storage: ${error.message}`);
    return false;
  }
}

// فحص Auth
async function checkSupabaseAuth() {
  console.log('\n6️⃣ فحص Supabase Authentication:');
  
  try {
    const url = `${SUPABASE_URL}/auth/v1/settings`;
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY
      },
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      console.log('   ✅ Authentication service متاح');
      const settings = await response.json();
      console.log(`   External providers: ${settings.external || 'غير محدد'}`);
      return true;
    } else {
      console.log(`   ❌ Authentication service غير متاح (${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في فحص Authentication: ${error.message}`);
    return false;
  }
}

// تشغيل جميع الفحوصات
async function runCompleteCheck() {
  console.log('='.repeat(60));
  
  const internetOk = await checkInternetConnection();
  const supabaseAccessOk = await checkSupabaseAccess();
  const apiOk = await checkSupabaseAPI();
  const tablesOk = await checkDatabaseTables();
  const storageOk = await checkSupabaseStorage();
  const authOk = await checkSupabaseAuth();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 ملخص شامل للنتائج:');
  console.log('='.repeat(60));
  
  console.log(`🌐 الاتصال بالإنترنت: ${internetOk ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`🔗 الوصول لموقع Supabase: ${supabaseAccessOk ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`🛠️ REST API: ${apiOk ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`📊 قاعدة البيانات: ${tablesOk ? '✅ متاحة' : '❌ غير متاحة'}`);
  console.log(`📁 Storage: ${storageOk ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`🔐 Authentication: ${authOk ? '✅ يعمل' : '❌ لا يعمل'}`);
  
  // تقييم الحالة العامة
  const coreServicesOk = internetOk && supabaseAccessOk && apiOk;
  const allServicesOk = coreServicesOk && tablesOk && storageOk && authOk;
  
  console.log('\n' + '='.repeat(60));
  
  if (allServicesOk) {
    console.log('🎉 حالة ممتازة: جميع خدمات Supabase تعمل بشكل مثالي!');
    console.log('✨ يمكنك استخدام التطبيق الآن بكامل الميزات');
  } else if (coreServicesOk) {
    console.log('✅ حالة جيدة: الخدمات الأساسية تعمل');
    console.log('⚠️ بعض الخدمات الإضافية قد لا تعمل بشكل كامل');
  } else {
    console.log('❌ مشكلة خطيرة: الخدمات الأساسية لا تعمل');
    console.log('\n🔧 خطوات الإصلاح العاجلة:');
    
    if (!internetOk) {
      console.log('   🚨 أولوية عالية: إصلاح اتصال الإنترنت');
    } else if (!supabaseAccessOk) {
      console.log('   🚨 تحقق من Firewall أو VPN');
      console.log('   🚨 تحقق من إعدادات DNS');
    } else if (!apiOk) {
      console.log('   🚨 تحقق من صحة SUPABASE_URL و ANON_KEY');
      console.log('   🚨 تحقق من حالة مشروع Supabase');
    }
  }
  
  console.log('\n📞 للمساعدة:');
  console.log('   - تحقق من لوحة تحكم Supabase: https://app.supabase.com');
  console.log('   - راجع وثائق Supabase: https://supabase.com/docs');
  
  console.log('\n✨ انتهى الفحص الشامل');
  
  return {
    overall: allServicesOk,
    core: coreServicesOk,
    details: {
      internet: internetOk,
      access: supabaseAccessOk,
      api: apiOk,
      database: tablesOk,
      storage: storageOk,
      auth: authOk
    }
  };
}

// تشغيل الفحص
console.log('🚀 بدء الفحص الشامل لـ Supabase...');
runCompleteCheck().then(result => {
  process.exit(result.core ? 0 : 1);
}).catch(error => {
  console.error('💥 خطأ في تشغيل الفحص:', error);
  process.exit(1);
});
