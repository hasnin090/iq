import dotenv from 'dotenv'
import { existsSync } from 'fs'

console.log('🔧 فحص إعدادات البيئة')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// تحميل متغيرات البيئة
dotenv.config()

// فحص وجود ملف .env
console.log('📁 فحص ملفات البيئة:')
const envExists = existsSync('.env')
const envExampleExists = existsSync('.env.example')

console.log(`   .env: ${envExists ? '✅ موجود' : '❌ مفقود'}`)
console.log(`   .env.example: ${envExampleExists ? '✅ موجود' : '❌ مفقود'}`)

if (!envExists) {
  console.log('\n⚠️ ملف .env غير موجود!')
  console.log('💡 قم بإنشاء ملف .env من .env.example:')
  console.log('   1. انسخ .env.example إلى .env')
  console.log('   2. أضف مفاتيح Supabase الحقيقية')
  console.log('   3. شغل الاختبار مرة أخرى')
  
  if (envExampleExists) {
    console.log('\n📋 محتوى .env.example كمرجع:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    const { readFileSync } = await import('fs')
    const exampleContent = readFileSync('.env.example', 'utf8')
    console.log(exampleContent)
  }
  process.exit(1)
}

// فحص المتغيرات المطلوبة
console.log('\n🔑 فحص متغيرات Supabase:')
const requiredVars = {
  'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
  'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
}

let allValid = true
for (const [key, value] of Object.entries(requiredVars)) {
  const isValid = value && value !== 'your-project-ref.supabase.co' && value !== 'your-anon-key-here'
  console.log(`   ${key}: ${isValid ? '✅' : '❌'} ${isValid ? 'محدد' : 'مفقود أو افتراضي'}`)
  if (!isValid) allValid = false
}

// فحص صيغة المفاتيح
if (requiredVars.VITE_SUPABASE_URL) {
  console.log('\n🔍 فحص صيغة URL:')
  const url = requiredVars.VITE_SUPABASE_URL
  if (url.startsWith('https://') && url.includes('.supabase.co')) {
    console.log(`   ✅ صيغة صحيحة: ${url}`)
  } else {
    console.log(`   ❌ صيغة خاطئة: ${url}`)
    console.log('   💡 يجب أن يكون: https://your-project-ref.supabase.co')
    allValid = false
  }
}

if (requiredVars.VITE_SUPABASE_ANON_KEY) {
  console.log('\n🔍 فحص مفتاح Anon:')
  const key = requiredVars.VITE_SUPABASE_ANON_KEY
  
  try {
    // فحص صيغة JWT
    const parts = key.split('.')
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]))
      console.log(`   ✅ JWT صالح`)
      console.log(`   🏷️ الدور: ${payload.role || 'غير محدد'}`)
      console.log(`   ⏰ انتهاء: ${new Date(payload.exp * 1000).toLocaleDateString('ar')}`)
      
      if (payload.role !== 'anon') {
        console.log('   ⚠️ الدور ليس anon')
      }
    } else {
      console.log(`   ❌ ليس JWT صالح`)
      allValid = false
    }
  } catch (error) {
    console.log(`   ❌ خطأ في تحليل JWT: ${error.message}`)
    allValid = false
  }
}

// نتيجة الفحص
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
if (allValid) {
  console.log('✅ جميع الإعدادات صحيحة!')
  console.log('🚀 يمكنك الآن تشغيل اختبار الاتصال')
  console.log('   npm run test:connection')
} else {
  console.log('❌ يرجى تصحيح الإعدادات أولاً')
  console.log('\n📋 كيفية الحصول على مفاتيح Supabase:')
  console.log('   1. اذهب إلى https://supabase.com/dashboard')
  console.log('   2. اختر مشروعك')
  console.log('   3. Settings → API')
  console.log('   4. انسخ URL و anon key و service_role key')
}
