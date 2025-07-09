// فحص اتصال Supabase أكثر تفصيلاً
const SUPABASE_URL = 'https://yieyqusnciiithjtlgod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMjA2MDQsImV4cCI6MjA1MDg5NjYwNH0.LUhEbdl2r0yRlQrHWzpJhvYLXhqLTfPc9W_3yVPc23s';

console.log('🔍 فحص اتصال Supabase تفصيلي...\n');

// فحص أساسي للURL
async function basicCheck() {
  console.log('1️⃣ فحص الـ URL الأساسي:');
  console.log(`   SUPABASE_URL: ${SUPABASE_URL}`);
  
  try {
    // فحص ping بسيط
    const response = await fetch(SUPABASE_URL, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    console.log(`   حالة الاستجابة: ${response.status}`);
    console.log(`   نص الحالة: ${response.statusText}`);
    
    if (response.ok) {
      console.log('   ✅ الـ URL متاح');
      return true;
    } else {
      console.log('   ❌ الـ URL غير متاح');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في الوصول للـ URL: ${error.message}`);
    
    // فحص نوع الخطأ
    if (error.code === 'ENOTFOUND') {
      console.log('   💡 المشكلة: لا يمكن العثور على الخادم (DNS problem)');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   💡 المشكلة: الخادم رفض الاتصال');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   💡 المشكلة: انتهت مهلة الاتصال');
    } else {
      console.log(`   💡 نوع الخطأ: ${error.code || 'غير محدد'}`);
    }
    
    return false;
  }
}

// فحص REST API
async function checkRestAPI() {
  console.log('\n2️⃣ فحص REST API:');
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/`;
    console.log(`   محاولة الوصول إلى: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 ثوانِ timeout
    });
    
    console.log(`   حالة الاستجابة: ${response.status}`);
    console.log(`   Headers الاستجابة:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('   ✅ REST API يعمل');
      return true;
    } else {
      const errorBody = await response.text();
      console.log(`   ❌ REST API لا يعمل - الرسالة: ${errorBody}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في REST API: ${error.message}`);
    
    if (error.name === 'TimeoutError') {
      console.log('   💡 المشكلة: انتهت مهلة الانتظار (10 ثواني)');
    }
    
    return false;
  }
}

// فحص الحالة العامة
async function checkHealth() {
  console.log('\n3️⃣ فحص الحالة العامة:');
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/health`;
    console.log(`   محاولة الوصول إلى: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY
      },
      signal: AbortSignal.timeout(5000)
    });
    
    console.log(`   حالة الاستجابة: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ خدمة الصحة تعمل');
      console.log(`   البيانات: ${JSON.stringify(data, null, 2)}`);
      return true;
    } else {
      console.log('   ❌ خدمة الصحة لا تعمل');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في فحص الصحة: ${error.message}`);
    return false;
  }
}

// فحص DNS
async function checkDNS() {
  console.log('\n4️⃣ فحص DNS:');
  
  const { lookup } = require('dns/promises');
  
  try {
    const hostname = new URL(SUPABASE_URL).hostname;
    console.log(`   محاولة حل DNS لـ: ${hostname}`);
    
    const addresses = await lookup(hostname, { all: true });
    console.log('   ✅ DNS يعمل بشكل صحيح');
    console.log(`   العناوين: ${addresses.map(a => `${a.address} (${a.family === 4 ? 'IPv4' : 'IPv6'})`).join(', ')}`);
    return true;
  } catch (error) {
    console.log(`   ❌ خطأ في DNS: ${error.message}`);
    return false;
  }
}

// تشغيل جميع الفحوصات
async function runDetailedCheck() {
  console.log('='.repeat(60));
  
  const dnsCheck = await checkDNS();
  const basicCheck_result = await basicCheck();
  const restCheck = await checkRestAPI();
  const healthCheck = await checkHealth();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 ملخص مفصل:');
  console.log(`🌐 DNS Resolution: ${dnsCheck ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`🔗 Basic URL Access: ${basicCheck_result ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`🛠️ REST API: ${restCheck ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`💚 Health Check: ${healthCheck ? '✅ يعمل' : '❌ لا يعمل'}`);
  
  const overallHealth = dnsCheck && basicCheck_result && restCheck;
  console.log(`\n🎯 الحالة العامة: ${overallHealth ? '✅ Supabase متاح' : '❌ Supabase غير متاح'}`);
  
  if (!overallHealth) {
    console.log('\n🔧 خطوات الإصلاح المقترحة:');
    if (!dnsCheck) console.log('   1. تحقق من اتصال الإنترنت');
    if (!basicCheck_result) console.log('   2. تحقق من صحة SUPABASE_URL');
    if (!restCheck) console.log('   3. تحقق من صحة SUPABASE_ANON_KEY');
    console.log('   4. تحقق من إعدادات Firewall/Proxy');
    console.log('   5. جرب من شبكة أخرى');
  }
  
  console.log('\n✨ انتهى الفحص التفصيلي');
}

// تشغيل الفحص
runDetailedCheck().catch(error => {
  console.error('💥 خطأ في تشغيل الفحص:', error);
});
