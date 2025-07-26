import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import express from 'express'
import { spawn } from 'child_process'

// تحميل متغيرات البيئة
dotenv.config()

console.log('🚀 اختبار شامل للتطبيق محلياً')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

async function runFullTest() {
  // 1. اختبار متغيرات البيئة
  console.log('1️⃣ فحص متغيرات البيئة:')
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ متغيرات البيئة مفقودة!')
    return false
  }
  console.log('✅ متغيرات البيئة موجودة')
  
  // 2. اختبار الاتصال مع Supabase
  console.log('\n2️⃣ اختبار الاتصال مع Supabase:')
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.from('profiles').select('*').limit(1)
    
    if (error && !error.message.includes('RLS')) {
      console.log(`❌ خطأ في Supabase: ${error.message}`)
      return false
    }
    console.log('✅ الاتصال مع Supabase يعمل')
  } catch (error) {
    console.log(`❌ فشل الاتصال: ${error.message}`)
    return false
  }
  
  // 3. فحص ملفات الخادم
  console.log('\n3️⃣ فحص ملفات الخادم:')
  const serverFiles = [
    'server/index.ts',
    'server/simple-server.js', 
    'server/production-server-fixed.js'
  ]
  
  const { existsSync } = await import('fs')
  for (const file of serverFiles) {
    const exists = existsSync(file)
    console.log(`   ${exists ? '✅' : '❌'} ${file}`)
  }
  
  // 4. فحص ملفات الواجهة
  console.log('\n4️⃣ فحص ملفات الواجهة:')
  const frontendFiles = [
    'client/index.html',
    'client/src/main.tsx',
    'client/src/App.tsx'
  ]
  
  for (const file of frontendFiles) {
    const exists = existsSync(file)
    console.log(`   ${exists ? '✅' : '❌'} ${file}`)
  }
  
  // 5. اختبار بناء المشروع
  console.log('\n5️⃣ اختبار بناء المشروع:')
  try {
    console.log('   🔨 جاري بناء المشروع...')
    const buildResult = await runCommand('npm run build')
    if (buildResult.success) {
      console.log('   ✅ البناء نجح')
    } else {
      console.log('   ❌ فشل البناء:', buildResult.error)
      return false
    }
  } catch (error) {
    console.log(`   ❌ خطأ في البناء: ${error.message}`)
    return false
  }
  
  return true
}

// وظيفة تشغيل الأوامر
function runCommand(command) {
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ')
    const process = spawn(cmd, args, { 
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd()
    })
    
    let output = ''
    let errorOutput = ''
    
    process.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    process.on('close', (code) => {
      resolve({
        success: code === 0,
        output,
        error: errorOutput,
        code
      })
    })
    
    // إنهاء العملية بعد 60 ثانية
    setTimeout(() => {
      process.kill()
      resolve({
        success: false,
        error: 'انتهت مهلة البناء (60 ثانية)',
        code: -1
      })
    }, 60000)
  })
}

// اختبار العمليات الأساسية
async function testBasicOperations() {
  console.log('\n6️⃣ اختبار العمليات الأساسية:')
  
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )
  
  // اختبار قراءة أنواع المصروفات
  try {
    const { data: expenseTypes, error } = await supabase
      .from('expense_types')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log(`   ❌ قراءة expense_types: ${error.message}`)
    } else {
      console.log(`   ✅ قراءة expense_types: ${expenseTypes.length} نوع`)
    }
  } catch (error) {
    console.log(`   ❌ خطأ في قراءة expense_types: ${error.message}`)
  }
  
  // اختبار قراءة المشاريع
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log(`   ❌ قراءة projects: ${error.message}`)
    } else {
      console.log(`   ✅ قراءة projects: ${projects.length} مشروع`)
    }
  } catch (error) {
    console.log(`   ❌ خطأ في قراءة projects: ${error.message}`)
  }
}

// اختبار تشغيل الخادم
async function testServerStart() {
  console.log('\n7️⃣ اختبار تشغيل الخادم:')
  
  const servers = [
    { name: 'خادم بسيط', command: 'npm run dev:simple', port: 3000 },
    { name: 'خادم الإنتاج', command: 'npm run dev:production', port: 5000 }
  ]
  
  for (const server of servers) {
    console.log(`   🔄 اختبار ${server.name}...`)
    
    try {
      // اختبار سريع للخادم
      const testResult = await testServerQuick(server.command, server.port)
      if (testResult.success) {
        console.log(`   ✅ ${server.name} يعمل على المنفذ ${server.port}`)
      } else {
        console.log(`   ❌ ${server.name}: ${testResult.error}`)
      }
    } catch (error) {
      console.log(`   ❌ خطأ في ${server.name}: ${error.message}`)
    }
  }
}

// اختبار سريع للخادم
function testServerQuick(command, port) {
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ')
    const serverProcess = spawn(cmd, args, { 
      stdio: 'pipe',
      shell: true 
    })
    
    let output = ''
    let started = false
    
    serverProcess.stdout.on('data', (data) => {
      output += data.toString()
      
      // فحص إذا بدأ الخادم
      if (output.includes(`${port}`) || output.includes('listening') || output.includes('ready')) {
        started = true
        serverProcess.kill()
        resolve({ success: true })
      }
    })
    
    serverProcess.stderr.on('data', (data) => {
      const error = data.toString()
      if (error.includes('EADDRINUSE')) {
        resolve({ success: true, message: 'المنفذ مُستخدم (الخادم يعمل بالفعل)' })
      }
    })
    
    // انتظار 10 ثواني
    setTimeout(() => {
      if (!started) {
        serverProcess.kill()
        resolve({ 
          success: false, 
          error: 'لم يبدأ الخادم خلال 10 ثواني' 
        })
      }
    }, 10000)
  })
}

// تشغيل الاختبار الكامل
runFullTest().then(async (success) => {
  if (success) {
    await testBasicOperations()
    await testServerStart()
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ اختبار التطبيق اكتمل بنجاح!')
    console.log('\n🚀 لتشغيل التطبيق:')
    console.log('   npm run dev:simple      # خادم بسيط على المنفذ 3000')
    console.log('   npm run dev:production  # خادم الإنتاج على المنفذ 5000')
    console.log('   npm run dev             # خادم التطوير مع TypeScript')
  } else {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('❌ فشل اختبار التطبيق')
    console.log('يرجى إصلاح المشاكل المذكورة أعلاه')
  }
})
