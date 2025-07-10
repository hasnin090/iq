import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// تحميل متغيرات البيئة
dotenv.config({ path: '../.env' })

// محاكاة process.env في frontend
const mockProcessEnv = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
}

// استيراد إعدادات العميل
const supabaseConfig = {
  url: mockProcessEnv.VITE_SUPABASE_URL || 'https://jcoekbaahgjympmnuilr.supabase.co',
  anonKey: mockProcessEnv.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjb2VrYmFhaGdqeW1wbW51aWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNTA1MDcsImV4cCI6MjA2NzYyNjUwN30.CGwebOhh_c4buoX_Uh111zzo8H3p4Ak_p3v3V0LcjRA',
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
}

console.log('🧪 اختبار إعدادات العميل (Client Configuration)')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

console.log('1️⃣ فحص إعدادات العميل:')
console.log(`   URL: ${supabaseConfig.url}`)
console.log(`   Key: ${supabaseConfig.anonKey ? 'موجود ✅' : 'مفقود ❌'}`)
console.log(`   Auth Config: ${JSON.stringify(supabaseConfig.auth)}`)

// إنشاء عميل Supabase
console.log('\n2️⃣ إنشاء عميل Supabase:')
try {
  const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: supabaseConfig.auth
  })
  
  console.log('   ✅ تم إنشاء العميل بنجاح')
  
  // اختبار الوظائف الأساسية
  console.log('\n3️⃣ اختبار الوظائف الأساسية:')
  
  // اختبار المصادقة
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    console.log(`   ❌ خطأ في المصادقة: ${sessionError.message}`)
  } else {
    console.log('   ✅ نظام المصادقة يعمل')
    console.log(`   📋 الجلسة الحالية: ${sessionData.session ? 'نشطة' : 'غير نشطة'}`)
  }
  
  // اختبار قاعدة البيانات
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .limit(3)
  
  if (userError) {
    console.log(`   ❌ خطأ في قاعدة البيانات: ${userError.message}`)
  } else {
    console.log('   ✅ قراءة قاعدة البيانات تعمل')
    console.log(`   👥 عدد المستخدمين المقروؤين: ${userData?.length || 0}`)
    if (userData && userData.length > 0) {
      console.log(`   📋 بيانات العينة: ${JSON.stringify(userData[0], null, 2)}`)
    }
  }
  
  // اختبار الجداول المختلفة
  console.log('\n4️⃣ اختبار الجداول المختلفة:')
  const tables = [
    { name: 'users', fields: 'id, email, full_name' },
    { name: 'projects', fields: 'id, name, description' },
    { name: 'transactions', fields: 'id, amount, description' },
    { name: 'documents', fields: 'id, name, file_path' }
  ]
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select(table.fields)
        .limit(1)
      
      if (error) {
        console.log(`   ❌ ${table.name}: ${error.message}`)
      } else {
        console.log(`   ✅ ${table.name}: متاح (${data?.length || 0} سجل)`)
      }
    } catch (e) {
      console.log(`   ❌ ${table.name}: خطأ في الطلب`)
    }
  }
  
} catch (error) {
  console.log(`   ❌ خطأ في إنشاء العميل: ${error.message}`)
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅ انتهى اختبار إعدادات العميل')
