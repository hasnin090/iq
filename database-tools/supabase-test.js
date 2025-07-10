import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// تحميل متغيرات البيئة
dotenv.config({ path: '../.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 اختبار شامل للاتصال مع Supabase')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// فحص متغيرات البيئة
console.log('1️⃣ فحص متغيرات البيئة:')
console.log(`   URL: ${supabaseUrl}`)
console.log(`   Anon Key: ${supabaseAnonKey ? 'موجود ✅' : 'مفقود ❌'}`)
console.log(`   Service Key: ${supabaseServiceKey ? 'موجود ✅' : 'مفقود ❌'}`)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ المفاتيح الأساسية مفقودة')
  process.exit(1)
}

// تحليل JWT للـ Anon Key
console.log('\n2️⃣ تحليل Anon Key:')
try {
  const parts = supabaseAnonKey.split('.')
  const payload = JSON.parse(atob(parts[1]))
  console.log(`   المُصدر: ${payload.iss}`)
  console.log(`   المرجع: ${payload.ref}`)
  console.log(`   الدور: ${payload.role || 'غير محدد ❌'}`)
  console.log(`   انتهاء الصلاحية: ${new Date(payload.exp * 1000).toLocaleDateString('ar')}`)
  
  if (payload.role === 'anon') {
    console.log('   ✅ Anon Key صحيح')
  } else {
    console.log('   ❌ مشكلة في دور المفتاح')
  }
} catch (error) {
  console.log('   ❌ خطأ في تحليل JWT:', error.message)
}

// اختبار الاتصال مع Anon Key
console.log('\n3️⃣ اختبار الاتصال مع Anon Key:')
try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // اختبار Auth
  const { data: authData, error: authError } = await supabase.auth.getSession()
  if (authError) {
    console.log(`   ❌ Auth Error: ${authError.message}`)
  } else {
    console.log('   ✅ خدمة المصادقة متاحة')
  }
  
  // اختبار قراءة جدول بسيط
  const { data, error } = await supabase.from('users').select('id').limit(1)
  if (error) {
    console.log(`   ❌ قاعدة البيانات: ${error.message}`)
  } else {
    console.log('   ✅ قاعدة البيانات متاحة')
    console.log(`   📊 عدد السجلات المقروءة: ${data?.length || 0}`)
  }
  
} catch (error) {
  console.log(`   ❌ خطأ عام: ${error.message}`)
}

// اختبار الاتصال مع Service Key
if (supabaseServiceKey) {
  console.log('\n4️⃣ اختبار الاتصال مع Service Key:')
  try {
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)
    
    // اختبار قراءة جدول مع صلاحيات أكبر
    const { data, error } = await supabaseService.from('users').select('*').limit(1)
    if (error) {
      console.log(`   ❌ Service Database: ${error.message}`)
    } else {
      console.log('   ✅ Service Key يعمل بشكل صحيح')
      console.log(`   📊 عدد السجلات: ${data?.length || 0}`)
    }
    
  } catch (error) {
    console.log(`   ❌ خطأ في Service Key: ${error.message}`)
  }
}

// اختبار الجداول الأساسية
console.log('\n5️⃣ اختبار الجداول الأساسية:')
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)
const tables = ['users', 'projects', 'transactions', 'documents']

for (const table of tables) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`)
    } else {
      console.log(`   ✅ ${table}: متاح (${data?.length || 0} سجل)`)
    }
  } catch (error) {
    console.log(`   ❌ ${table}: خطأ في الطلب`)
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅ انتهى اختبار الاتصال مع Supabase')
