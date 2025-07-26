#!/usr/bin/env node

console.log('🔐 تعليمات الحصول على SERVICE_ROLE_KEY')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('📋 الخطوات:')
console.log('1. اذهب إلى Supabase Dashboard: https://supabase.com/dashboard')
console.log('2. اختر مشروعك: arabic-accounting-system')
console.log('3. انقر على Settings (في الشريط الجانبي)')
console.log('4. انقر على API')
console.log('5. انسخ "service_role" key (تحت Project API keys)')
console.log('')
console.log('⚠️ تحذير: service_role key سري جداً ولا يجب مشاركته!')
console.log('')
console.log('📝 بعد الحصول على المفتاح:')
console.log('أضف السطر التالي إلى ملف .env:')
console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here')
console.log('')
console.log('🔄 بديل: تشغيل المخطط يدوياً')
console.log('1. اذهب إلى Supabase Dashboard → SQL Editor')
console.log('2. انسخ محتوى ملف supabase-schema.sql')
console.log('3. الصقه في المحرر')
console.log('4. انقر RUN')
console.log('')
console.log('💡 نصيحة: يمكنك اختبار الاتصال فقط بـ:')
console.log('npm run test:connection')
