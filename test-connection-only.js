#!/usr/bin/env node
/**
 * اختبار سريع للاتصال بـ Supabase
 */

import dotenv from 'dotenv'

// تحميل متغيرات البيئة
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

console.log('🔍 اختبار سريع للاتصال بـ Supabase')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// فحص متغيرات البيئة
console.log('\n📋 فحص الإعدادات:')
console.log(`🔗 URL: ${supabaseUrl || '❌ مفقود'}`)
console.log(`🔑 Key: ${supabaseAnonKey ? '✅ موجود' : '❌ مفقود'}`)

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ خطأ: مفاتيح Supabase مفقودة!')
  console.log('💡 شغّل: npm run setup:env لإعداد الملف')
  process.exit(1)
}

// اختبار الاتصال
async function testConnection() {
  try {
    console.log('\n🚀 اختبار الاتصال...')
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      }
    })
    
    if (response.ok) {
      console.log('✅ الاتصال ناجح!')
      console.log(`📊 حالة الاستجابة: ${response.status}`)
      
      // محاولة قراءة جدول إذا كان موجوداً
      const testTable = await fetch(`${supabaseUrl}/rest/v1/settings?select=count`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Prefer': 'count=exact'
        }
      })
      
      if (testTable.ok) {
        console.log('✅ قاعدة البيانات متاحة')
        console.log('\n🎉 كل شيء يعمل بشكل صحيح!')
        console.log('💡 شغّل: npm run test:schema لتشغيل المخطط')
      } else {
        console.log('⚠️ قاعدة البيانات فارغة أو غير مهيأة')
        console.log('💡 شغّل: npm run test:schema لإنشاء الجداول')
      }
      
    } else {
      console.log(`❌ فشل الاتصال: ${response.status} - ${response.statusText}`)
      
      if (response.status === 401) {
        console.log('💡 تحقق من صحة anon key')
      } else if (response.status === 404) {
        console.log('💡 تحقق من صحة project URL')
      }
    }
    
  } catch (error) {
    console.log('❌ خطأ في الاتصال:', error.message)
    console.log('💡 تحقق من اتصال الإنترنت وإعدادات Supabase')
  }
}

testConnection()
