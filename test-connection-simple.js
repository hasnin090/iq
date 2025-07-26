import http from 'http'

console.log('🧪 اختبار اتصال بسيط مع الخادم')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

function testConnection(url, callback) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: url,
    method: 'GET',
    timeout: 5000
  }
  
  const req = http.request(options, (res) => {
    console.log(`✅ ${url} - Status: ${res.statusCode}`)
    
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      if (res.headers['content-type'] && res.headers['content-type'].includes('json')) {
        try {
          const json = JSON.parse(data)
          if (json.message) {
            console.log(`   💬 ${json.message}`)
          }
        } catch (e) {
          console.log('   📄 JSON Response')
        }
      } else {
        console.log('   📄 HTML Response')
      }
      callback()
    })
  })
  
  req.on('error', (error) => {
    console.log(`❌ ${url} - Error: ${error.message}`)
    callback()
  })
  
  req.on('timeout', () => {
    console.log(`⏰ ${url} - Timeout`)
    req.destroy()
    callback()
  })
  
  req.end()
}

const urls = [
  '/api/health',
  '/api/test-supabase',
  '/api/projects',
  '/api/expense-types'
]

let currentIndex = 0

function testNext() {
  if (currentIndex < urls.length) {
    testConnection(urls[currentIndex], () => {
      currentIndex++
      setTimeout(testNext, 1000)
    })
  } else {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ انتهى اختبار الاتصال')
    console.log('🌐 افتح http://localhost:5000 في المتصفح')
  }
}

testNext()
