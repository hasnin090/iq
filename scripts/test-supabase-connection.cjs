// اختبار اتصال Supabase مع البيانات الجديدة
const dotenv = require('dotenv');
const path = require('path');

// تحميل متغيرات البيئة من ملف .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 اختبار اتصال Supabase مع البيانات الجديدة...\n');

// فحص متغيرات البيئة
function checkEnvironmentVariables() {
  console.log('1️⃣ فحص متغيرات البيئة:');
  
  const vars = [
    { name: 'SUPABASE_URL', value: SUPABASE_URL },
    { name: 'SUPABASE_ANON_KEY', value: SUPABASE_ANON_KEY },
    { name: 'VITE_SUPABASE_URL', value: VITE_SUPABASE_URL },
    { name: 'VITE_SUPABASE_ANON_KEY', value: VITE_SUPABASE_ANON_KEY }
  ];
  
  let allGood = true;
  
  vars.forEach(v => {
    if (v.value) {
      console.log(`   ✅ ${v.name}: ${v.value.substring(0, 30)}...`);
    } else {
      console.log(`   ❌ ${v.name}: غير موجود`);
      allGood = false;
    }
  });
  
  return allGood;
}

// فحص الاتصال الأساسي
async function testBasicConnection() {
  console.log('\n2️⃣ فحص الاتصال الأساسي:');
  
  try {
    console.log(`   محاولة الوصول إلى: ${SUPABASE_URL}`);
    
    const response = await fetch(SUPABASE_URL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`   حالة الاستجابة: ${response.status} ${response.statusText}`);
    
    if (response.status < 400) {
      console.log('   ✅ الاتصال الأساسي يعمل');
      return true;
    } else {
      console.log('   ❌ الاتصال الأساسي فشل');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في الاتصال الأساسي: ${error.message}`);
    return false;
  }
}

// فحص REST API
async function testRestAPI() {
  console.log('\n3️⃣ فحص REST API:');
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/`;
    console.log(`   محاولة الوصول إلى: ${url}`);
    
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
      console.log('   ✅ REST API يعمل بشكل ممتاز');
      return true;
    } else if (response.status === 401) {
      console.log('   ❌ مشكلة في المصادقة - تحقق من ANON_KEY');
      return false;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ REST API فشل: ${errorText.substring(0, 100)}...`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في REST API: ${error.message}`);
    return false;
  }
}

// فحص الجداول
async function testDatabaseTables() {
  console.log('\n4️⃣ فحص الوصول للجداول:');
  
  const tables = ['users', 'projects', 'transactions', 'documents'];
  const workingTables = [];
  
  for (const table of tables) {
    try {
      console.log(`   فحص جدول ${table}...`);
      
      const url = `${SUPABASE_URL}/rest/v1/${table}?select=count&limit=1`;
      const response = await fetch(url, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(8000)
      });
      
      console.log(`      حالة: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`      ✅ جدول ${table} متاح`);
        workingTables.push(table);
      } else if (response.status === 401) {
        console.log(`      ❌ جدول ${table}: مشكلة في المصادقة`);
      } else if (response.status === 403) {
        console.log(`      ❌ جدول ${table}: لا توجد أذونات`);
      } else {
        console.log(`      ❌ جدول ${table}: غير متاح`);
      }
    } catch (error) {
      console.log(`      ❌ جدول ${table}: خطأ - ${error.message}`);
    }
  }
  
  console.log(`\n   📊 النتيجة: ${workingTables.length}/${tables.length} جداول متاحة`);
  if (workingTables.length > 0) {
    console.log(`   الجداول العاملة: ${workingTables.join(', ')}`);
  }
  
  return workingTables.length;
}

// فحص Storage
async function testStorage() {
  console.log('\n5️⃣ فحص Supabase Storage:');
  
  try {
    const url = `${SUPABASE_URL}/storage/v1/bucket`;
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      signal: AbortSignal.timeout(8000)
    });
    
    console.log(`   حالة الاستجابة: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const buckets = await response.json();
      console.log('   ✅ Storage متاح');
      
      if (Array.isArray(buckets)) {
        console.log(`   عدد الـ buckets: ${buckets.length}`);
        if (buckets.length > 0) {
          console.log(`   الـ buckets: ${buckets.map(b => b.name).join(', ')}`);
        } else {
          console.log('   لا توجد buckets (يمكن إنشاؤها لاحقاً)');
        }
      }
      return true;
    } else {
      console.log('   ❌ Storage غير متاح');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في Storage: ${error.message}`);
    return false;
  }
}

// فحص Authentication
async function testAuth() {
  console.log('\n6️⃣ فحص Authentication:');
  
  try {
    const url = `${SUPABASE_URL}/auth/v1/settings`;
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY
      },
      signal: AbortSignal.timeout(8000)
    });
    
    console.log(`   حالة الاستجابة: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('   ✅ Authentication service متاح');
      try {
        const settings = await response.json();
        console.log(`   الإعدادات: ${JSON.stringify(settings, null, 2).substring(0, 200)}...`);
      } catch (e) {
        console.log('   الإعدادات: متاحة');
      }
      return true;
    } else {
      console.log('   ❌ Authentication service غير متاح');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في Authentication: ${error.message}`);
    return false;
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('='.repeat(60));
  
  const envCheck = checkEnvironmentVariables();
  const basicCheck = await testBasicConnection();
  const apiCheck = await testRestAPI();
  const tablesCount = await testDatabaseTables();
  const storageCheck = await testStorage();
  const authCheck = await testAuth();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 ملخص شامل للاختبارات:');
  console.log('='.repeat(60));
  
  console.log(`🔧 متغيرات البيئة: ${envCheck ? '✅ مكتملة' : '❌ ناقصة'}`);
  console.log(`🔗 الاتصال الأساسي: ${basicCheck ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`🛠️ REST API: ${apiCheck ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`📊 قاعدة البيانات: ${tablesCount > 0 ? `✅ ${tablesCount} جداول متاحة` : '❌ غير متاحة'}`);
  console.log(`📁 Storage: ${storageCheck ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`🔐 Authentication: ${authCheck ? '✅ يعمل' : '❌ لا يعمل'}`);
  
  // تقييم الحالة العامة
  const coreWorking = envCheck && basicCheck && apiCheck;
  const fullWorking = coreWorking && tablesCount > 0 && storageCheck && authCheck;
  
  console.log('\n' + '='.repeat(60));
  
  if (fullWorking) {
    console.log('🎉 حالة ممتازة: جميع خدمات Supabase تعمل بشكل مثالي!');
    console.log('✨ يمكنك الآن استخدام التطبيق بكامل الميزات');
    console.log('📱 جميع الوظائف متاحة: قاعدة البيانات، التخزين، المصادقة');
  } else if (coreWorking) {
    console.log('✅ حالة جيدة: الخدمات الأساسية تعمل بنجاح');
    console.log('⚠️  بعض الخدمات الإضافية قد تحتاج إعداد');
    
    if (tablesCount === 0) {
      console.log('💡 نصيحة: قد تحتاج إنشاء الجداول في قاعدة البيانات');
    }
    if (!storageCheck) {
      console.log('💡 نصيحة: قد تحتاج إعداد Storage buckets');
    }
    if (!authCheck) {
      console.log('💡 نصيحة: قد تحتاج إعداد Authentication');
    }
  } else {
    console.log('❌ مشكلة في الإعدادات الأساسية');
    console.log('🔧 يجب إصلاح المشاكل الأساسية أولاً');
    
    if (!envCheck) {
      console.log('   - تحقق من ملف .env');
    }
    if (!basicCheck) {
      console.log('   - تحقق من SUPABASE_URL');
    }
    if (!apiCheck) {
      console.log('   - تحقق من SUPABASE_ANON_KEY');
    }
  }
  
  console.log('\n✨ انتهى الاختبار الشامل');
  
  return {
    success: fullWorking,
    coreWorking: coreWorking,
    details: {
      env: envCheck,
      basic: basicCheck,
      api: apiCheck,
      tables: tablesCount,
      storage: storageCheck,
      auth: authCheck
    }
  };
}

// تشغيل الاختبارات
console.log('🚀 بدء اختبار شامل لاتصال Supabase...');
runAllTests().then(result => {
  if (result.success) {
    console.log('\n🎯 النتيجة النهائية: كل شيء يعمل بشكل ممتاز!');
    process.exit(0);
  } else if (result.coreWorking) {
    console.log('\n🎯 النتيجة النهائية: الخدمات الأساسية تعمل، بعض الميزات تحتاج إعداد');
    process.exit(0);
  } else {
    console.log('\n🎯 النتيجة النهائية: يجب إصلاح مشاكل الإعداد');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 خطأ في تشغيل الاختبارات:', error);
  process.exit(1);
});
