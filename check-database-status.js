import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// تحميل متغيرات البيئة
dotenv.config()

console.log('📊 فحص شامل لحالة قاعدة البيانات')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

async function checkDatabaseStatus() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ مفاتيح Supabase مفقودة')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // قائمة الجداول المطلوبة
  const requiredTables = [
    'profiles', 'projects', 'user_roles', 'expense_types', 
    'employees', 'employee_projects', 'transactions', 'documents',
    'document_links', 'activity_logs', 'ledger_entries', 'receivables',
    'receivable_payments', 'completed_works', 'completed_work_documents',
    'settings', 'notifications', 'budget_tracking', 'custom_reports',
    'whatsapp_messages', 'backups'
  ]
  
  console.log('🔍 فحص الجداول الموجودة:')
  
  const existingTables = []
  const missingTables = []
  
  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`   ❌ ${tableName}: غير موجود`)
          missingTables.push(tableName)
        } else {
          console.log(`   ⚠️ ${tableName}: ${error.message}`)
          existingTables.push(tableName)
        }
      } else {
        console.log(`   ✅ ${tableName}: موجود (${data.length} سجل)`)
        existingTables.push(tableName)
      }
    } catch (error) {
      console.log(`   ❌ ${tableName}: خطأ في الطلب`)
      missingTables.push(tableName)
    }
    
    // انتظار قصير لتجنب الضغط على الخادم
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log('\n📈 ملخص النتائج:')
  console.log(`   ✅ جداول موجودة: ${existingTables.length}/${requiredTables.length}`)
  console.log(`   ❌ جداول مفقودة: ${missingTables.length}/${requiredTables.length}`)
  
  if (missingTables.length > 0) {
    console.log('\n📋 الجداول المفقودة:')
    missingTables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table}`)
    })
    
    console.log('\n🔧 لإنشاء الجداول المفقودة:')
    console.log('   1. افتح Supabase Dashboard')
    console.log('   2. اذهب إلى SQL Editor')
    console.log('   3. انسخ محتوى ملف supabase-schema.sql')
    console.log('   4. شغل SQL')
  } else {
    console.log('\n🎉 جميع الجداول موجودة!')
    
    // اختبار العمليات الأساسية
    console.log('\n🧪 اختبار العمليات الأساسية:')
    await testBasicOperations(supabase)
  }
  
  // فحص البيانات الأولية
  console.log('\n📂 فحص البيانات الأولية:')
  await checkInitialData(supabase)
}

async function testBasicOperations(supabase) {
  try {
    // اختبار قراءة من expense_types
    const { data: expenseTypes, error: expenseError } = await supabase
      .from('expense_types')
      .select('*')
      .limit(5)
    
    if (expenseError) {
      console.log(`   ❌ قراءة expense_types: ${expenseError.message}`)
    } else {
      console.log(`   ✅ قراءة expense_types: ${expenseTypes.length} نوع مصروف`)
    }
    
    // اختبار قراءة من settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .limit(5)
    
    if (settingsError) {
      console.log(`   ❌ قراءة settings: ${settingsError.message}`)
    } else {
      console.log(`   ✅ قراءة settings: ${settings.length} إعداد`)
    }
    
  } catch (error) {
    console.log(`   ❌ خطأ في اختبار العمليات: ${error.message}`)
  }
}

async function checkInitialData(supabase) {
  try {
    // فحص أنواع المصروفات
    const { data: expenseTypes } = await supabase
      .from('expense_types')
      .select('name')
    
    console.log(`   📊 أنواع المصروفات: ${expenseTypes?.length || 0}`)
    
    // فحص الإعدادات
    const { data: settings } = await supabase
      .from('settings')
      .select('key')
    
    console.log(`   ⚙️ الإعدادات: ${settings?.length || 0}`)
    
    // عرض بعض أنواع المصروفات إن وجدت
    if (expenseTypes && expenseTypes.length > 0) {
      console.log('   🏷️ أمثلة على أنواع المصروفات:')
      expenseTypes.slice(0, 3).forEach(type => {
        console.log(`      • ${type.name}`)
      })
    }
    
  } catch (error) {
    console.log(`   ❌ خطأ في فحص البيانات: ${error.message}`)
  }
}

// تشغيل الفحص
checkDatabaseStatus().then(() => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ انتهى فحص قاعدة البيانات')
})
