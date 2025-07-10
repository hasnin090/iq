import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 فحص شامل لقاعدة البيانات بعد الإعداد')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// جميع الجداول المطلوبة
const allTables = [
  'users',
  'projects', 
  'transactions',
  'documents',
  'categories',
  'accounts',
  'invoices',
  'invoice_items',
  'payments',
  'contacts',
  'settings'
]

async function comprehensiveCheck() {
  console.log('1️⃣ فحص وجود الجداول:')
  const tableStatus = {}
  
  for (const tableName of allTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1)
      
      if (error) {
        console.log(`   ❌ ${tableName}: غير موجود`)
        tableStatus[tableName] = false
      } else {
        console.log(`   ✅ ${tableName}: موجود (${count || 0} سجل)`)
        tableStatus[tableName] = true
        
        // عرض عينة من البيانات
        if (data && data.length > 0) {
          const fields = Object.keys(data[0])
          console.log(`      📋 الحقول: ${fields.slice(0, 5).join(', ')}${fields.length > 5 ? '...' : ''}`)
        }
      }
    } catch (e) {
      console.log(`   ❌ ${tableName}: خطأ في الاتصال`)
      tableStatus[tableName] = false
    }
  }
  
  // فحص العلاقات والقيود
  console.log('\n2️⃣ فحص البيانات الأساسية:')
  
  // فحص الفئات
  if (tableStatus.categories) {
    try {
      const { data, count } = await supabase
        .from('categories')
        .select('*', { count: 'exact' })
      
      console.log(`   📂 الفئات: ${count} فئة`)
      if (data && data.length > 0) {
        const types = [...new Set(data.map(c => c.type))]
        console.log(`      الأنواع: ${types.join(', ')}`)
      }
    } catch (e) {
      console.log(`   ❌ خطأ في قراءة الفئات`)
    }
  }
  
  // فحص الحسابات
  if (tableStatus.accounts) {
    try {
      const { data, count } = await supabase
        .from('accounts')
        .select('*', { count: 'exact' })
      
      console.log(`   💰 الحسابات: ${count} حساب`)
      if (data && data.length > 0) {
        const types = [...new Set(data.map(a => a.type))]
        console.log(`      الأنواع: ${types.join(', ')}`)
        
        // حساب إجمالي الأرصدة
        const totalBalance = data.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0)
        console.log(`      إجمالي الأرصدة: ${totalBalance.toLocaleString()} IQD`)
      }
    } catch (e) {
      console.log(`   ❌ خطأ في قراءة الحسابات`)
    }
  }
  
  // فحص الفواتير
  if (tableStatus.invoices) {
    try {
      const { data, count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact' })
      
      console.log(`   🧾 الفواتير: ${count} فاتورة`)
      if (data && data.length > 0) {
        const totalAmount = data.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0)
        console.log(`      إجمالي المبالغ: ${totalAmount.toLocaleString()} IQD`)
        
        const statuses = [...new Set(data.map(i => i.status))]
        console.log(`      الحالات: ${statuses.join(', ')}`)
      }
    } catch (e) {
      console.log(`   ❌ خطأ في قراءة الفواتير`)
    }
  }
  
  // فحص المدفوعات
  if (tableStatus.payments) {
    try {
      const { data, count } = await supabase
        .from('payments')
        .select('*', { count: 'exact' })
      
      console.log(`   💳 المدفوعات: ${count} دفعة`)
      if (data && data.length > 0) {
        const totalReceived = data.filter(p => p.type === 'received').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        const totalPaid = data.filter(p => p.type === 'paid').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        console.log(`      المقبوضات: ${totalReceived.toLocaleString()} IQD`)
        console.log(`      المدفوعات: ${totalPaid.toLocaleString()} IQD`)
      }
    } catch (e) {
      console.log(`   ❌ خطأ في قراءة المدفوعات`)
    }
  }
  
  // فحص جهات الاتصال
  if (tableStatus.contacts) {
    try {
      const { data, count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact' })
      
      console.log(`   👥 جهات الاتصال: ${count} جهة`)
      if (data && data.length > 0) {
        const types = [...new Set(data.map(c => c.type))]
        console.log(`      الأنواع: ${types.join(', ')}`)
      }
    } catch (e) {
      console.log(`   ❌ خطأ في قراءة جهات الاتصال`)
    }
  }
  
  // فحص المعاملات
  if (tableStatus.transactions) {
    try {
      const { data, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
      
      console.log(`   📊 المعاملات: ${count} معاملة`)
      if (data && data.length > 0) {
        const totalIncome = data.filter(t => t.type === 'income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
        const totalExpense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
        console.log(`      الإيرادات: ${totalIncome.toLocaleString()} IQD`)
        console.log(`      المصروفات: ${totalExpense.toLocaleString()} IQD`)
        console.log(`      صافي الربح: ${(totalIncome - totalExpense).toLocaleString()} IQD`)
      }
    } catch (e) {
      console.log(`   ❌ خطأ في قراءة المعاملات`)
    }
  }
  
  // ملخص عام
  console.log('\n3️⃣ ملخص عام:')
  const existingTables = Object.values(tableStatus).filter(Boolean).length
  const totalTables = allTables.length
  
  console.log(`   📊 الجداول الموجودة: ${existingTables}/${totalTables}`)
  console.log(`   📈 نسبة الإكمال: ${Math.round((existingTables/totalTables) * 100)}%`)
  
  if (existingTables === totalTables) {
    console.log('   🎉 قاعدة البيانات مكتملة ومهيأة للاستخدام!')
  } else {
    console.log('   ⚠️  يجب إنشاء الجداول المفقودة باستخدام ملف database-setup.sql')
    console.log('   📝 الجداول المفقودة:')
    allTables.forEach(table => {
      if (!tableStatus[table]) {
        console.log(`      - ${table}`)
      }
    })
  }
}

await comprehensiveCheck()

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅ انتهى الفحص الشامل لقاعدة البيانات')
