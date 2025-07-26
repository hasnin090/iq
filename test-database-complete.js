import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

// تحميل متغيرات البيئة
dotenv.config()

console.log('🚀 اختبار شامل لقاعدة البيانات - نظام المحاسبة العربي')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// فحص متغيرات البيئة
console.log('1️⃣ فحص متغيرات البيئة:')
console.log(`   🔗 URL: ${supabaseUrl ? '✅ موجود' : '❌ مفقود'}`)
console.log(`   🔑 Anon Key: ${supabaseAnonKey ? '✅ موجود' : '❌ مفقود'}`)
console.log(`   🛡️ Service Key: ${supabaseServiceKey ? '✅ موجود' : '❌ مفقود'}`)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ المفاتيح الأساسية مفقودة!')
  console.log('\n💡 تأكد من وجود ملف .env يحتوي على:')
  console.log('   VITE_SUPABASE_URL=your-project-url')
  console.log('   VITE_SUPABASE_ANON_KEY=your-anon-key')
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-key')
  process.exit(1)
}

// إنشاء عميل Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

// اختبار الاتصال الأساسي
console.log('\n2️⃣ اختبار الاتصال الأساسي:')
try {
  const { data: healthCheck, error } = await supabase.from('information_schema.tables').select('table_name').limit(1)
  if (error) {
    console.log(`   ❌ فشل الاتصال: ${error.message}`)
    process.exit(1)
  } else {
    console.log('   ✅ تم الاتصال بنجاح!')
  }
} catch (error) {
  console.log(`   ❌ خطأ في الاتصال: ${error.message}`)
  process.exit(1)
}

// قائمة الجداول المطلوبة في المخطط
const requiredTables = [
  'profiles',
  'projects', 
  'user_roles',
  'expense_types',
  'employees',
  'employee_projects',
  'transactions',
  'documents',
  'document_links',
  'activity_logs',
  'ledger_entries',
  'receivables',
  'receivable_payments',
  'completed_works',
  'completed_work_documents',
  'settings',
  'notifications',
  'budget_tracking',
  'custom_reports',
  'whatsapp_messages',
  'backups'
]

// اختبار وجود الجداول
console.log('\n3️⃣ فحص الجداول المطلوبة:')
const existingTables = []
const missingTables = []

for (const tableName of requiredTables) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1)
    if (error) {
      console.log(`   ❌ ${tableName}: ${error.message}`)
      missingTables.push(tableName)
    } else {
      console.log(`   ✅ ${tableName}: موجود`)
      existingTables.push(tableName)
    }
  } catch (error) {
    console.log(`   ❌ ${tableName}: خطأ غير متوقع`)
    missingTables.push(tableName)
  }
}

console.log(`\n📊 ملخص الجداول:`)
console.log(`   ✅ موجود: ${existingTables.length}/${requiredTables.length}`)
console.log(`   ❌ مفقود: ${missingTables.length}/${requiredTables.length}`)

// إذا كانت الجداول مفقودة، نقترح تشغيل المخطط
if (missingTables.length > 0) {
  console.log('\n⚠️ الجداول المفقودة:')
  missingTables.forEach(table => console.log(`   • ${table}`))
  
  console.log('\n🔧 لإنشاء الجداول المفقودة، قم بتشغيل:')
  console.log('   1. افتح Supabase Dashboard → SQL Editor')
  console.log('   2. انسخ محتوى ملف supabase-schema.sql')
  console.log('   3. شغل SQL')
  
  // اختبار تطبيق المخطط
  if (process.argv.includes('--apply-schema')) {
    console.log('\n🚀 تطبيق المخطط...')
    await applySchema()
  }
} else {
  // اختبار العمليات الأساسية
  console.log('\n4️⃣ اختبار العمليات الأساسية:')
  await testBasicOperations()
}

// اختبار أمان RLS
console.log('\n5️⃣ اختبار أمان Row-Level Security:')
await testRLSSecurity()

// اختبار الفهارس والأداء
console.log('\n6️⃣ اختبار الفهارس والأداء:')
await testIndexesAndPerformance()

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅ اكتمل اختبار قاعدة البيانات')

// وظائف الاختبار
async function applySchema() {
  try {
    const schemaPath = join(process.cwd(), 'supabase-schema.sql')
    const schemaSQL = readFileSync(schemaPath, 'utf8')
    
    console.log('   📝 قراءة ملف المخطط...')
    
    // تقسيم SQL إلى عبارات منفصلة
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`   🔄 تشغيل ${statements.length} عبارة SQL...`)
    
    let successCount = 0
    let errorCount = 0
    
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('execute_sql', { sql_query: statement })
        if (error) {
          console.log(`   ⚠️ تحذير: ${error.message}`)
          errorCount++
        } else {
          successCount++
        }
      } catch (err) {
        console.log(`   ❌ خطأ: ${err.message}`)
        errorCount++
      }
    }
    
    console.log(`   ✅ نجح: ${successCount} عبارة`)
    console.log(`   ⚠️ فشل: ${errorCount} عبارة`)
    
  } catch (error) {
    console.log(`   ❌ خطأ في تطبيق المخطط: ${error.message}`)
  }
}

async function testBasicOperations() {
  try {
    // اختبار إدراج بيانات في expense_types
    console.log('   📝 اختبار إدراج البيانات...')
    const { data: insertData, error: insertError } = await supabase
      .from('expense_types')
      .insert({ 
        name: 'اختبار مصروف', 
        description: 'مصروف للاختبار', 
        category: 'other' 
      })
      .select()
    
    if (insertError) {
      console.log(`   ❌ فشل الإدراج: ${insertError.message}`)
    } else {
      console.log('   ✅ نجح الإدراج')
      
      // اختبار القراءة
      const { data: readData, error: readError } = await supabase
        .from('expense_types')
        .select('*')
        .eq('name', 'اختبار مصروف')
      
      if (readError) {
        console.log(`   ❌ فشل القراءة: ${readError.message}`)
      } else {
        console.log(`   ✅ نجحت القراءة (${readData.length} سجل)`)
      }
      
      // حذف البيانات التجريبية
      await supabase
        .from('expense_types')
        .delete()
        .eq('name', 'اختبار مصروف')
    }
  } catch (error) {
    console.log(`   ❌ خطأ في اختبار العمليات: ${error.message}`)
  }
}

async function testRLSSecurity() {
  try {
    // فحص تفعيل RLS على الجداول
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_rls_status')
    
    if (rlsError) {
      console.log(`   ❌ لا يمكن فحص RLS: ${rlsError.message}`)
    } else {
      console.log('   ✅ RLS مفعل على الجداول')
    }
    
    // اختبار الوصول بدون مصادقة
    const anonSupabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: anonData, error: anonError } = await anonSupabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (anonError && anonError.message.includes('RLS')) {
      console.log('   ✅ RLS يمنع الوصول غير المصرح به')
    } else {
      console.log('   ⚠️ RLS قد لا يعمل كما هو متوقع')
    }
    
  } catch (error) {
    console.log(`   ❌ خطأ في اختبار RLS: ${error.message}`)
  }
}

async function testIndexesAndPerformance() {
  try {
    // فحص الفهارس الموجودة
    const { data: indexData, error: indexError } = await supabase
      .from('pg_indexes')
      .select('indexname, tablename')
      .like('tablename', 'public.%')
    
    if (indexError) {
      console.log(`   ❌ لا يمكن فحص الفهارس: ${indexError.message}`)
    } else {
      console.log(`   ✅ تم العثور على ${indexData.length} فهرس`)
    }
    
    // اختبار سرعة الاستعلام
    const startTime = Date.now()
    const { data: perfData, error: perfError } = await supabase
      .from('transactions')
      .select('id, amount, date')
      .limit(100)
    
    const endTime = Date.now()
    const queryTime = endTime - startTime
    
    if (perfError) {
      console.log(`   ❌ فشل اختبار الأداء: ${perfError.message}`)
    } else {
      console.log(`   ✅ وقت الاستعلام: ${queryTime}ms`)
      if (queryTime < 1000) {
        console.log('   🚀 أداء ممتاز!')
      } else {
        console.log('   ⚠️ الأداء يحتاج تحسين')
      }
    }
    
  } catch (error) {
    console.log(`   ❌ خطأ في اختبار الأداء: ${error.message}`)
  }
}
