// أداة لاختبار واكتشاف URL صحيح لـ Supabase
console.log('🔍 محاولة اكتشاف URL صحيح لـ Supabase...\n');

// قائمة من URLs محتملة
const possibleUrls = [
  'https://yieyqusnciiithjtlgod.supabase.co',
  'https://yieyqusnciiithjtlgod.supabase.io', // قد يكون .io بدلاً من .co
  'https://yieyqusnciiithjtglod.supabase.co', // قد يكون خطأ إملائي
  'https://yieyqusnciiithjtlgod.supabase.com', // قد يكون .com
];

// ANON keys محتملة
const possibleKeys = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMjA2MDQsImV4cCI6MjA1MDg5NjYwNH0.LUhEbdl2r0yRlQrHWzpJhvYLXhqLTfPc9W_3yVPc23s',
];

async function testUrl(url) {
  try {
    console.log(`   جاري اختبار: ${url}`);
    
    // اختبار أساسي
    const headResponse = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    console.log(`      HEAD: ${headResponse.status} ${headResponse.statusText}`);
    
    if (headResponse.status < 400) {
      // اختبار REST API
      try {
        const apiResponse = await fetch(`${url}/rest/v1/`, {
          headers: {
            'apikey': possibleKeys[0]
          },
          signal: AbortSignal.timeout(5000)
        });
        
        console.log(`      API: ${apiResponse.status} ${apiResponse.statusText}`);
        
        if (apiResponse.status < 500) {
          return {
            url: url,
            working: true,
            headStatus: headResponse.status,
            apiStatus: apiResponse.status
          };
        }
      } catch (apiError) {
        console.log(`      API خطأ: ${apiError.message}`);
      }
      
      return {
        url: url,
        working: 'partial',
        headStatus: headResponse.status,
        apiStatus: 'failed'
      };
    }
    
    return {
      url: url,
      working: false,
      headStatus: headResponse.status
    };
    
  } catch (error) {
    console.log(`      خطأ: ${error.message}`);
    return {
      url: url,
      working: false,
      error: error.message
    };
  }
}

async function discoverSupabaseUrl() {
  console.log('1️⃣ اختبار URLs محتملة:\n');
  
  const results = [];
  
  for (const url of possibleUrls) {
    const result = await testUrl(url);
    results.push(result);
    console.log(''); // سطر فارغ
  }
  
  console.log('=' * 50);
  console.log('📊 ملخص النتائج:');
  console.log('=' * 50);
  
  const workingUrls = results.filter(r => r.working === true);
  const partialUrls = results.filter(r => r.working === 'partial');
  const failedUrls = results.filter(r => r.working === false);
  
  if (workingUrls.length > 0) {
    console.log('✅ URLs تعمل بشكل كامل:');
    workingUrls.forEach(r => {
      console.log(`   ${r.url} (HEAD: ${r.headStatus}, API: ${r.apiStatus})`);
    });
  }
  
  if (partialUrls.length > 0) {
    console.log('\n⚠️ URLs تعمل جزئياً:');
    partialUrls.forEach(r => {
      console.log(`   ${r.url} (HEAD: ${r.headStatus}, API: failed)`);
    });
  }
  
  if (failedUrls.length > 0) {
    console.log('\n❌ URLs لا تعمل:');
    failedUrls.forEach(r => {
      console.log(`   ${r.url} ${r.error ? `(${r.error})` : `(${r.headStatus})`}`);
    });
  }
  
  // اقتراحات
  console.log('\n💡 الاقتراحات:');
  
  if (workingUrls.length > 0) {
    console.log(`✨ استخدم هذا URL: ${workingUrls[0].url}`);
    console.log('✨ أنشئ ملف .env مع:');
    console.log(`SUPABASE_URL=${workingUrls[0].url}`);
    console.log(`SUPABASE_ANON_KEY=${possibleKeys[0]}`);
  } else if (partialUrls.length > 0) {
    console.log(`⚠️ قد يعمل هذا URL: ${partialUrls[0].url}`);
    console.log('⚠️ لكن تحقق من ANON_KEY');
  } else {
    console.log('🚨 لم يتم العثور على URL صالح');
    console.log('🚨 خيارات:');
    console.log('   1. إنشاء مشروع Supabase جديد');
    console.log('   2. التحقق من حالة المشروع الحالي');
    console.log('   3. استخدام قاعدة بيانات محلية');
  }
  
  return workingUrls.length > 0 ? workingUrls[0] : null;
}

// فحص إضافي للشبكة
async function checkNetworkDiagnostics() {
  console.log('\n2️⃣ فحص تشخيص الشبكة:');
  
  // فحص مواقع مختلفة
  const testSites = [
    'https://www.google.com',
    'https://app.supabase.com',
    'https://api.supabase.io'
  ];
  
  for (const site of testSites) {
    try {
      const response = await fetch(site, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      console.log(`   ✅ ${site}: ${response.status}`);
    } catch (error) {
      console.log(`   ❌ ${site}: ${error.message}`);
    }
  }
}

// تشغيل الاكتشاف
async function main() {
  await checkNetworkDiagnostics();
  const result = await discoverSupabaseUrl();
  
  console.log('\n✨ انتهى الاكتشاف');
  
  if (result) {
    console.log('\n🎉 تم العثور على إعدادات صحيحة!');
    console.log('📝 اتبع هذه الخطوات:');
    console.log('1. أنشئ ملف .env في جذر المشروع');
    console.log(`2. أضف: SUPABASE_URL=${result.url}`);
    console.log(`3. أضف: SUPABASE_ANON_KEY=${possibleKeys[0].substring(0, 30)}...`);
    console.log('4. أعد تشغيل التطبيق');
  } else {
    console.log('\n❌ لم يتم العثور على إعدادات صحيحة');
    console.log('🔧 يجب إنشاء مشروع Supabase جديد أو إصلاح المشروع الحالي');
  }
}

main().catch(error => {
  console.error('💥 خطأ في الاكتشاف:', error);
});
