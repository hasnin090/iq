// فحص اتصال Supabase مبسط
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yieyqusnciiithjtlgod.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoanRsZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMjA2MDQsImV4cCI6MjA1MDg5NjYwNH0.LUhEbdl2r0yRlQrHWzpJhvYLXhqLTfPc9W_3yVPc23s';

console.log('🔍 فحص اتصال Supabase...\n');

// 1. فحص متغيرات البيئة
console.log('1️⃣ فحص متغيرات البيئة:');
console.log(`   SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`   SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'غير موجود'}`);

// 2. فحص REST API
console.log('\n2️⃣ فحص REST API:');

async function checkSupabaseAPI() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    console.log(`   حالة الاستجابة: ${response.status}`);
    console.log(`   نص الحالة: ${response.statusText}`);
    
    if (response.ok) {
      console.log('   ✅ REST API يعمل بنجاح');
      return true;
    } else {
      console.log('   ❌ REST API لا يعمل');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في الاتصال: ${error.message}`);
    return false;
  }
}

// 3. فحص جدول المستخدمين
async function checkUsersTable() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=count`, {
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
      console.log(`   عدد المستخدمين: ${Array.isArray(data) ? data.length : 'غير محدد'}`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ خطأ في الوصول لجدول المستخدمين: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في فحص جدول المستخدمين: ${error.message}`);
    return false;
  }
}

// 4. فحص Storage
async function checkStorage() {
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    console.log(`   حالة الاستجابة: ${response.status}`);
    
    if (response.ok) {
      const buckets = await response.json();
      console.log('   ✅ Storage متاح');
      console.log(`   عدد الـ buckets: ${Array.isArray(buckets) ? buckets.length : 'غير محدد'}`);
      if (Array.isArray(buckets) && buckets.length > 0) {
        console.log(`   الـ buckets: ${buckets.map(b => b.name).join(', ')}`);
      }
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ خطأ في الوصول للـ Storage: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ خطأ في فحص Storage: ${error.message}`);
    return false;
  }
}

// تشغيل جميع الفحوصات
async function runAllChecks() {
  console.log('\n' + '='.repeat(50));
  
  const apiCheck = await checkSupabaseAPI();
  
  console.log('\n3️⃣ فحص جدول المستخدمين:');
  const usersCheck = await checkUsersTable();
  
  console.log('\n4️⃣ فحص Storage:');
  const storageCheck = await checkStorage();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 ملخص النتائج:');
  console.log(`✅ REST API: ${apiCheck ? 'يعمل' : 'لا يعمل'}`);
  console.log(`✅ جدول المستخدمين: ${usersCheck ? 'يعمل' : 'لا يعمل'}`);
  console.log(`✅ Storage: ${storageCheck ? 'يعمل' : 'لا يعمل'}`);
  
  const allGood = apiCheck && usersCheck && storageCheck;
  console.log(`\n🎯 الحالة العامة: ${allGood ? '✅ كل شيء يعمل بشكل صحيح' : '❌ هناك مشاكل تحتاج إصلاح'}`);
  
  if (!allGood) {
    console.log('\n🔧 المشاكل المحتملة:');
    if (!apiCheck) console.log('   - تحقق من SUPABASE_URL و SUPABASE_ANON_KEY');
    if (!usersCheck) console.log('   - تحقق من أذونات جدول المستخدمين');
    if (!storageCheck) console.log('   - تحقق من إعدادات Storage');
  }
  
  console.log('\n✨ انتهى الفحص');
}

// تشغيل الفحص
runAllChecks().catch(error => {
  console.error('💥 خطأ في تشغيل الفحص:', error);
});
