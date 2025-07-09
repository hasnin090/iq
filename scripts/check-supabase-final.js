// فحص اتصال Supabase أكثر تفصيلاً - CommonJS
const SUPABASE_URL = 'https://yieyqusnciiithjtlgod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMjA2MDQsImV4cCI6MjA1MDg5NjYwNH0.LUhEbdl2r0yRlQrHWzpJhvYLXhqLTfPc9W_3yVPc23s';

console.log('🔍 فحص اتصال Supabase تفصيلي...\n');

// فحص DNS
async function checkDNS() {
  console.log('1️⃣ فحص DNS:');
  
  const dns = require('dns');
  const { promisify } = require('util');
  const lookup = promisify(dns.lookup);
  
  try {
    const hostname = new URL(SUPABASE_URL).hostname;
    console.log(`   محاولة حل DNS لـ: ${hostname}`);
    
    const address = await lookup(hostname);
    console.log('   ✅ DNS يعمل بشكل صحيح');
    console.log(`   العنوان: ${address.address} (${address.family === 4 ? 'IPv4' : 'IPv6'})`);
    return true;
  } catch (error) {
    console.log(`   ❌ خطأ في DNS: ${error.message}`);
    console.log('   💡 تحقق من اتصال الإنترنت أو إعدادات DNS');
    return false;
  }
}

// فحص أساسي للURL
async function basicCheck() {
  console.log('\n2️⃣ فحص الـ URL الأساسي:');
  console.log(`   SUPABASE_URL: ${SUPABASE_URL}`);
  
  try {
    console.log('   محاولة الوصول للموقع...');
    const response = await fetch(SUPABASE_URL, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   حالة الاستجابة: ${response.status}`);
    console.log(`   نص الحالة: ${response.statusText}`);
    
    if (response.status < 400) {
      console.log('   ✅ الـ URL متاح');
      return true;
    } else {
      console.log('   ❌ الـ URL يعطي خطأ');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في الوصول للـ URL: ${error.message}`);
    
    // فحص نوع الخطأ
    if (error.cause?.code === 'ENOTFOUND') {
      console.log('   💡 المشكلة: لا يمكن العثور على الخادم (DNS problem)');
    } else if (error.cause?.code === 'ECONNREFUSED') {
      console.log('   💡 المشكلة: الخادم رفض الاتصال');
    } else if (error.cause?.code === 'ETIMEDOUT') {
      console.log('   💡 المشكلة: انتهت مهلة الاتصال');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.log('   💡 المشكلة: خطأ في شبكة الإنترنت أو Firewall');
    } else {
      console.log(`   💡 نوع الخطأ: ${error.cause?.code || error.name || 'غير محدد'}`);
    }
    
    return false;
  }
}

// فحص REST API
async function checkRestAPI() {
  console.log('\n3️⃣ فحص REST API:');
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/`;
    console.log(`   محاولة الوصول إلى: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 ثوانِ
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`   حالة الاستجابة: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type') || 'غير محدد'}`);
    
    if (response.ok) {
      console.log('   ✅ REST API يعمل');
      return true;
    } else {
      const errorBody = await response.text();
      console.log(`   ❌ REST API لا يعمل - الرسالة: ${errorBody.substring(0, 200)}...`);
      
      if (response.status === 401) {
        console.log('   💡 المشكلة: مشكلة في المصادقة (تحقق من ANON_KEY)');
      } else if (response.status === 403) {
        console.log('   💡 المشكلة: ممنوع الوصول');
      } else if (response.status === 404) {
        console.log('   💡 المشكلة: المسار غير موجود');
      }
      
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في REST API: ${error.message}`);
    
    if (error.name === 'AbortError') {
      console.log('   💡 المشكلة: انتهت مهلة الانتظار (10 ثواني)');
    }
    
    return false;
  }
}

// فحص جدول بسيط
async function checkSimpleTable() {
  console.log('\n4️⃣ فحص الوصول للجداول:');
  
  try {
    // جرب جدول users أولاً
    const url = `${SUPABASE_URL}/rest/v1/users?limit=1`;
    console.log(`   محاولة الوصول إلى جدول users...`);
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   حالة الاستجابة: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ جدول المستخدمين متاح');
      console.log(`   عدد السجلات المسترجعة: ${Array.isArray(data) ? data.length : 'غير محدد'}`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ جدول المستخدمين غير متاح: ${errorText.substring(0, 100)}...`);
      
      // جرب جدول آخر
      console.log('   جاري تجربة جداول أخرى...');
      
      const tables = ['projects', 'transactions', 'documents'];
      for (const table of tables) {
        try {
          const tableUrl = `${SUPABASE_URL}/rest/v1/${table}?limit=1`;
          const tableResponse = await fetch(tableUrl, {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
          
          if (tableResponse.ok) {
            console.log(`   ✅ جدول ${table} متاح`);
            return true;
          }
        } catch (e) {
          // تجاهل
        }
      }
      
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في فحص الجداول: ${error.message}`);
    return false;
  }
}

// فحص الشبكة المحلية
async function checkNetworkConnectivity() {
  console.log('\n5️⃣ فحص الاتصال العام:');
  
  try {
    console.log('   فحص الاتصال بـ Google...');
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

// تشغيل جميع الفحوصات
async function runDetailedCheck() {
  console.log('='.repeat(60));
  
  const networkCheck = await checkNetworkConnectivity();
  const dnsCheck = await checkDNS();
  const basicCheck_result = await basicCheck();
  const restCheck = await checkRestAPI();
  const tableCheck = await checkSimpleTable();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 ملخص مفصل:');
  console.log(`🌐 Internet Connectivity: ${networkCheck ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`🔍 DNS Resolution: ${dnsCheck ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`🔗 Basic URL Access: ${basicCheck_result ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`🛠️ REST API: ${restCheck ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`📊 Database Tables: ${tableCheck ? '✅ يعمل' : '❌ لا يعمل'}`);
  
  const overallHealth = networkCheck && dnsCheck && basicCheck_result && restCheck;
  const databaseHealth = overallHealth && tableCheck;
  
  console.log(`\n🎯 حالة الاتصال: ${overallHealth ? '✅ Supabase متاح' : '❌ Supabase غير متاح'}`);
  console.log(`🎯 حالة قاعدة البيانات: ${databaseHealth ? '✅ متاحة' : '❌ غير متاحة'}`);
  
  if (!overallHealth) {
    console.log('\n🔧 خطوات الإصلاح المقترحة:');
    
    if (!networkCheck) {
      console.log('   🚨 مشكلة أساسية: لا يوجد اتصال بالإنترنت');
      console.log('      - تحقق من إعدادات الشبكة');
      console.log('      - تحقق من Wi-Fi/Ethernet');
    } else {
      if (!dnsCheck) console.log('   1. تحقق من إعدادات DNS (جرب 8.8.8.8 أو 1.1.1.1)');
      if (!basicCheck_result) console.log('   2. تحقق من Firewall أو Proxy settings');
      if (!restCheck) console.log('   3. تحقق من صحة SUPABASE_ANON_KEY');
      if (!tableCheck) console.log('   4. تحقق من أذونات الجداول في Supabase');
    }
  } else if (!databaseHealth) {
    console.log('\n🔧 مشكلة في قاعدة البيانات:');
    console.log('   - تحقق من إعدادات Row Level Security (RLS)');
    console.log('   - تحقق من وجود الجداول في قاعدة البيانات');
    console.log('   - تحقق من أذونات المستخدم');
  } else {
    console.log('\n🎉 كل شيء يعمل بشكل ممتاز!');
    console.log('   - يمكنك استخدام التطبيق الآن');
    console.log('   - جميع الخدمات متاحة');
  }
  
  console.log('\n✨ انتهى الفحص التفصيلي');
}

// تشغيل الفحص
console.log('🚀 بدء الفحص الشامل...');
runDetailedCheck().catch(error => {
  console.error('💥 خطأ في تشغيل الفحص:', error);
});
