import fetch from 'node-fetch'

console.log('🧪 اختبار شامل لمسارات API')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const BASE_URL = 'http://localhost:5000'

const endpoints = [
  { name: 'الصفحة الرئيسية', url: '/', method: 'GET' },
  { name: 'فحص الصحة', url: '/api/health', method: 'GET' },
  { name: 'اختبار Supabase', url: '/api/test-supabase', method: 'GET' },
  { name: 'المستخدمون', url: '/api/users', method: 'GET' },
  { name: 'المشاريع', url: '/api/projects', method: 'GET' },
  { name: 'المعاملات', url: '/api/transactions', method: 'GET' },
  { name: 'لوحة التحكم', url: '/api/dashboard', method: 'GET' },
  { name: 'الإعدادات', url: '/api/settings', method: 'GET' },
  { name: 'أنواع المصروفات', url: '/api/expense-types', method: 'GET' },
  { name: 'الموظفون', url: '/api/employees', method: 'GET' }
]

async function testEndpoint(endpoint) {
  try {
    console.log(`🔄 اختبار: ${endpoint.name}`)
    
    const startTime = Date.now()
    const response = await fetch(`${BASE_URL}${endpoint.url}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
    const endTime = Date.now()
    
    const status = response.status
    const responseTime = endTime - startTime
    
    let result = ''
    if (status >= 200 && status < 300) {
      result = '✅'
    } else if (status >= 400 && status < 500) {
      result = '⚠️'
    } else {
      result = '❌'
    }
    
    console.log(`   ${result} ${status} - ${responseTime}ms`)
    
    // إذا كان JSON، اعرض بعض البيانات
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = await response.json()
        if (Array.isArray(data)) {
          console.log(`   📊 عدد العناصر: ${data.length}`)
        } else if (data.message) {
          console.log(`   💬 الرسالة: ${data.message}`)
        } else if (data.status) {
          console.log(`   📊 الحالة: ${data.status}`)
        }
      } catch (e) {
        // تجاهل أخطاء JSON
      }
    }
    
    return { success: status < 400, status, responseTime }
    
  } catch (error) {
    console.log(`   ❌ خطأ: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runAllTests() {
  let successCount = 0
  let totalCount = endpoints.length
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint)
    if (result.success) {
      successCount++
    }
    
    // انتظار قصير بين الطلبات
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📊 النتائج: ${successCount}/${totalCount} مسار يعمل`)
  
  if (successCount === totalCount) {
    console.log('🎉 جميع المسارات تعمل بنجاح!')
  } else {
    console.log('⚠️ بعض المسارات تحتاج إصلاح')
  }
  
  console.log('\n🌐 روابط مفيدة:')
  console.log(`   🏠 الواجهة: ${BASE_URL}`)
  console.log(`   🔍 فحص الصحة: ${BASE_URL}/api/health`)
  console.log(`   📊 لوحة التحكم: ${BASE_URL}/api/dashboard`)
}

// فحص إذا كان الخادم يعمل أولاً
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`, { timeout: 5000 })
    if (response.ok) {
      console.log('✅ الخادم يعمل - بدء الاختبار\n')
      return true
    }
  } catch (error) {
    console.log('❌ الخادم لا يعمل')
    console.log('💡 شغل الخادم أولاً: npm run dev:simple')
    return false
  }
}

// تشغيل الاختبار
checkServer().then(isRunning => {
  if (isRunning) {
    runAllTests()
  }
})
