#!/usr/bin/env node

// Test Supabase connection with environment variables
const https = require('https');

console.log('🔍 اختبار الاتصال بـ Supabase - Testing Supabase Connection');
console.log('='.repeat(60));

// تحقق من المتغيرات
const requiredVars = [
  'SUPABASE_DATABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'PUBLIC_SUPABASE_DATABASE_URL',
  'PUBLIC_SUPABASE_ANON_KEY'
];

console.log('📋 فحص متغيرات البيئة:');
let allVarsPresent = true;
requiredVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: موجود`);
  } else {
    console.log(`❌ ${varName}: غير موجود`);
    allVarsPresent = false;
  }
});

if (!allVarsPresent) {
  console.log('\n❌ متغيرات البيئة مفقودة. يرجى إعدادها أولاً.');
  process.exit(1);
}

// اختبار الاتصال
console.log('\n🌐 اختبار الاتصال بـ Supabase...');

const supabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.PUBLIC_SUPABASE_DATABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.log('❌ رابط Supabase أو المفتاح العام غير موجود');
  process.exit(1);
}

// تحويل URL إلى REST API URL
const restUrl = supabaseUrl.replace('https://', '').replace('.supabase.co', '') + '.supabase.co';
const apiUrl = `https://${restUrl}/rest/v1/`;

console.log(`🔗 محاولة الاتصال بـ: ${apiUrl}`);

const options = {
  hostname: restUrl,
  port: 443,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`📡 حالة الاستجابة: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    console.log('✅ نجح الاتصال بـ Supabase!');
    console.log('🎉 جميع المتغيرات تعمل بشكل صحيح');
  } else if (res.statusCode === 401) {
    console.log('❌ خطأ في المصادقة - تحقق من المفاتيح');
  } else {
    console.log(`⚠️ استجابة غير متوقعة: ${res.statusCode}`);
  }
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('📊 البيانات المستلمة: اتصال ناجح');
    } else {
      console.log('📊 رسالة الخطأ:', data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.log('❌ خطأ في الاتصال:', error.message);
  console.log('🔍 تحقق من:');
  console.log('  - صحة رابط Supabase');
  console.log('  - صحة المفتاح العام');
  console.log('  - الاتصال بالإنترنت');
});

req.setTimeout(10000, () => {
  console.log('⏰ انتهت مهلة الاتصال');
  req.destroy();
});

req.end();

// معلومات إضافية
console.log('\n📋 معلومات إضافية:');
console.log(`🌍 URL المشروع: ${supabaseUrl}`);
console.log(`🔑 المفتاح العام: ${anonKey.substring(0, 20)}...`);
console.log(`🔗 REST API: ${apiUrl}`);

console.log('\n🔧 في حالة وجود مشاكل:');
console.log('1. تحقق من أن المتغيرات مضبوطة في Netlify');
console.log('2. تأكد من أن المشروع نشط في Supabase');
console.log('3. تحقق من أن API Keys صحيحة');
console.log('4. جرب إعادة النشر في Netlify');
