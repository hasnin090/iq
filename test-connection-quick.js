import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// تحميل متغيرات البيئة
dotenv.config()

console.log('🔍 اختبار سريع للاتصال مع Supabase')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

async function quickTest() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  
  console.log('📋 فحص المتغيرات:')
  console.log(`   URL: ${supabaseUrl ? '✅' : '❌'} ${supabaseUrl}`)
  console.log(`   Key: ${supabaseKey ? '✅' : '❌'} ${supabaseKey ? 'موجود' : 'مفقود'}`)
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('\n❌ متغيرات البيئة مفقودة!')
    console.log('تأكد من وجود ملف .env مع:')
    console.log('VITE_SUPABASE_URL=your-project-url')
    console.log('VITE_SUPABASE_ANON_KEY=your-anon-key')
    return
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('\n🔌 اختبار الاتصال...')
    
    // اختبار بسيط للاتصال
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (error) {
      console.log(`❌ خطأ: ${error.message}`)
      
      // إذا كان الخطأ يتعلق بعدم وجود جدول، فهذا يعني الاتصال يعمل
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('✅ الاتصال يعمل! الجداول غير موجودة بعد.')
        console.log('💡 تحتاج لتشغيل supabase-schema.sql في SQL Editor')
        return true
      }
      return false
    } else {
      console.log('✅ الاتصال ناجح!')
      console.log(`📊 جدول profiles موجود (${data.length} سجل)`)
      return true
    }
    
  } catch (error) {
    console.log(`❌ خطأ في الاتصال: ${error.message}`)
    return false
  }
}

// تشغيل الاختبار
quickTest().then(success => {
  if (success) {
    console.log('\n🎉 الاتصال مع Supabase يعمل بنجاح!')
  } else {
    console.log('\n💥 فشل الاتصال مع Supabase')
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
})
