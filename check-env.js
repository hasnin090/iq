#!/usr/bin/env node

// فحص المتغيرات البيئية
console.log('🔍 فحص المتغيرات البيئية...\n');

const requiredVars = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'SESSION_SECRET': process.env.SESSION_SECRET,
  'PGDATABASE': process.env.PGDATABASE,
  'PGHOST': process.env.PGHOST,
  'PGUSER': process.env.PGUSER,
  'PGPASSWORD': process.env.PGPASSWORD,
  'PGPORT': process.env.PGPORT
};

const optionalVars = {
  'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
  'SUPABASE_URL': process.env.SUPABASE_URL,
  'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY
};

console.log('📋 المتغيرات المطلوبة:');
for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    const maskedValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${key}: ${maskedValue}`);
  } else {
    console.log(`❌ ${key}: غير معرف`);
  }
}

console.log('\n🔧 المتغيرات الاختيارية:');
for (const [key, value] of Object.entries(optionalVars)) {
  if (value) {
    const maskedValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${key}: ${maskedValue}`);
  } else {
    console.log(`⚠️ ${key}: غير معرف (اختياري)`);
  }
}

// فحص اتصال قاعدة البيانات
if (requiredVars.DATABASE_URL) {
  console.log('\n🔗 فحص اتصال قاعدة البيانات...');
  
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(requiredVars.DATABASE_URL);
    
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ اتصال قاعدة البيانات ناجح');
    console.log(`⏰ وقت الخادم: ${result[0].current_time}`);
  } catch (error) {
    console.log('❌ فشل في الاتصال بقاعدة البيانات:', error.message);
  }
} else {
  console.log('\n❌ لا يمكن فحص قاعدة البيانات - DATABASE_URL غير معرف');
}

console.log('\n🎯 حالة النظام:');
const missingRequired = Object.entries(requiredVars).filter(([key, value]) => !value);
if (missingRequired.length === 0) {
  console.log('✅ جميع المتغيرات المطلوبة موجودة');
} else {
  console.log('❌ متغيرات مفقودة:', missingRequired.map(([key]) => key).join(', '));
}