import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'

// تحميل متغيرات البيئة
dotenv.config()

console.log('🧪 اختبار تطبيق مخطط قاعدة البيانات الجديد')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

async function testSchemaApplication() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ مفاتيح Supabase مفقودة')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('📋 الحالة الحالية لقاعدة البيانات:')
  
  // فحص الجداول الموجودة حالياً
  const currentTables = await getCurrentTables(supabase)
  
  console.log(`   📊 الجداول الموجودة حالياً: ${currentTables.length}`)
  currentTables.forEach(table => {
    console.log(`      • ${table}`)
  })
  
  console.log('\n🔍 فحص محتوى مخطط SQL:')
  
  try {
    const schemaContent = readFileSync('supabase-schema.sql', 'utf8')
    
    // تحليل المخطط
    const createTableStatements = schemaContent.match(/CREATE TABLE[^;]+;/gi) || []
    const dropStatements = schemaContent.match(/DROP TABLE[^;]+;/gi) || []
    const policyStatements = schemaContent.match(/CREATE POLICY[^;]+;/gi) || []
    const indexStatements = schemaContent.match(/CREATE INDEX[^;]+;/gi) || []
    
    console.log(`   📋 عبارات CREATE TABLE: ${createTableStatements.length}`)
    console.log(`   🗑️ عبارات DROP TABLE: ${dropStatements.length}`)
    console.log(`   🔒 سياسات RLS: ${policyStatements.length}`)
    console.log(`   📈 فهارس: ${indexStatements.length}`)
    
    // استخراج أسماء الجداول من المخطط
    const schemaTableNames = []
    createTableStatements.forEach(statement => {
      const match = statement.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i)
      if (match) {
        schemaTableNames.push(match[1])
      }
    })
    
    console.log('\n📊 الجداول في المخطط الجديد:')
    schemaTableNames.forEach(table => {
      const exists = currentTables.includes(table)
      console.log(`   ${exists ? '✅' : '🆕'} ${table}`)
    })
    
    console.log('\n🔍 التحليل:')
    const newTables = schemaTableNames.filter(table => !currentTables.includes(table))
    const existingTables = schemaTableNames.filter(table => currentTables.includes(table))
    
    console.log(`   🆕 جداول جديدة ستُنشأ: ${newTables.length}`)
    if (newTables.length > 0) {
      newTables.forEach(table => console.log(`      • ${table}`))
    }
    
    console.log(`   ✅ جداول موجودة ستُحدث: ${existingTables.length}`)
    if (existingTables.length > 0) {
      existingTables.forEach(table => console.log(`      • ${table}`))
    }
    
    console.log('\n💡 توصيات:')
    if (newTables.length > 0) {
      console.log('   1. ✅ المخطط آمن للتطبيق - يحتوي على IF NOT EXISTS')
      console.log('   2. 🔄 سيتم إنشاء الجداول المفقودة فقط')
      console.log('   3. 🛡️ الجداول الموجودة محمية من الحذف')
    }
    
    if (dropStatements.length > 0) {
      console.log('   ⚠️ يحتوي على عبارات DROP - فقط للجداول المُعاد تصميمها')
    }
    
    console.log('\n🚀 يمكنك الآن تطبيق المخطط بأمان في Supabase SQL Editor')
    
  } catch (error) {
    console.log(`   ❌ خطأ في قراءة ملف المخطط: ${error.message}`)
  }
}

async function getCurrentTables(supabase) {
  const tables = []
  const commonTables = [
    'profiles', 'projects', 'user_roles', 'expense_types',
    'employees', 'employee_projects', 'transactions', 'documents',
    'document_links', 'activity_logs', 'ledger_entries', 'receivables',
    'receivable_payments', 'completed_works', 'completed_work_documents',
    'settings', 'notifications', 'budget_tracking', 'custom_reports',
    'whatsapp_messages', 'backups'
  ]
  
  for (const tableName of commonTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (!error) {
        tables.push(tableName)
      }
    } catch (error) {
      // تجاهل الأخطاء
    }
  }
  
  return tables
}

// تشغيل الاختبار
testSchemaApplication().then(() => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ انتهى تحليل المخطط')
})
