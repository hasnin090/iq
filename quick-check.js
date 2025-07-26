import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { existsSync } from 'fs'

dotenv.config()

console.log('🔍 فحص سريع لجاهزية التطبيق')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

async function quickCheck() {
  let allGood = true
  
  // 1. فحص متغيرات البيئة
  console.log('📋 متغيرات البيئة:')
  const env = {
    SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    SUPABASE_KEY: process.env.VITE_SUPABASE_ANON_KEY
  }
  
  for (const [key, value] of Object.entries(env)) {
    if (value) {
      console.log(`   ✅ ${key}`)
    } else {
      console.log(`   ❌ ${key} مفقود`)
      allGood = false
    }
  }
  
  // 2. فحص الاتصال
  if (env.SUPABASE_URL && env.SUPABASE_KEY) {
    console.log('\n🔗 اختبار الاتصال:')
    try {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY)
      const { data, error } = await supabase.from('profiles').select('id').limit(1)
      
      if (error && !error.message.includes('RLS')) {
        console.log(`   ❌ ${error.message}`)
        allGood = false
      } else {
        console.log('   ✅ الاتصال يعمل')
      }
    } catch (error) {
      console.log(`   ❌ ${error.message}`)
      allGood = false
    }
  }
  
  // 3. فحص الملفات الأساسية
  console.log('\n📁 الملفات الأساسية:')
  const files = [
    'package.json',
    'client/index.html',
    'client/src/main.tsx',
    'server/simple-server.js',
    'supabase-schema.sql'
  ]
  
  for (const file of files) {
    if (existsSync(file)) {
      console.log(`   ✅ ${file}`)
    } else {
      console.log(`   ❌ ${file} مفقود`)
      allGood = false
    }
  }
  
  // 4. نتيجة الفحص
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (allGood) {
    console.log('🎉 التطبيق جاهز للتشغيل!')
    console.log('\n🚀 أوامر التشغيل:')
    console.log('   npm run dev:simple      # خادم بسيط')
    console.log('   npm run dev:production  # خادم الإنتاج')
    console.log('   npm run test:full       # اختبار شامل')
  } else {
    console.log('⚠️ يرجى إصلاح المشاكل أولاً')
  }
}

quickCheck()
