import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { spawn } from 'child_process'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3000

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

console.log('🚀 تشغيل نظام المحاسبة العربي - شركة طريق العامرة')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'الخادم يعمل بنجاح',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Test Supabase connection
app.get('/api/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1)
    
    if (error && !error.message.includes('RLS')) {
      throw error
    }
    
    res.json({
      status: 'success',
      message: 'اتصال Supabase يعمل بنجاح',
      connected: true
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'فشل الاتصال مع Supabase',
      error: error.message
    })
  }
})

// Projects API
app.get('/api/projects', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    res.json({
      status: 'success',
      data: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطأ في استرجاع المشاريع',
      error: error.message
    })
  }
})

// Expense Types API
app.get('/api/expense-types', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expense_types')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    
    res.json({
      status: 'success',
      data: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطأ في استرجاع أنواع المصروفات',
      error: error.message
    })
  }
})

// Transactions API
app.get('/api/transactions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        expense_types(name, category),
        projects(name)
      `)
      .order('date', { ascending: false })
      .limit(50)
    
    if (error) throw error
    
    res.json({
      status: 'success',
      data: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطأ في استرجاع المعاملات',
      error: error.message
    })
  }
})

// Dashboard API
app.get('/api/dashboard', async (req, res) => {
  try {
    // Get basic stats
    const [
      { data: projects, error: projectsError },
      { data: transactions, error: transactionsError },
      { data: employees, error: employeesError }
    ] = await Promise.all([
      supabase.from('projects').select('id, status, budget, spent'),
      supabase.from('transactions').select('amount, type, date').gte('date', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]),
      supabase.from('employees').select('id').eq('active', true)
    ])
    
    if (projectsError || transactionsError || employeesError) {
      throw projectsError || transactionsError || employeesError
    }
    
    // Calculate stats
    const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
    const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
    const activeProjects = projects?.filter(p => p.status === 'active').length || 0
    const totalBudget = projects?.reduce((sum, p) => sum + parseFloat(p.budget || 0), 0) || 0
    
    res.json({
      status: 'success',
      data: {
        totalProjects: projects?.length || 0,
        activeProjects,
        totalEmployees: employees?.length || 0,
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        totalBudget,
        recentTransactions: transactions?.slice(0, 5) || []
      }
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطأ في استرجاع بيانات لوحة التحكم',
      error: error.message
    })
  }
})

// Start Vite dev server in parallel
let viteProcess = null

function startViteServer() {
  console.log('🎨 بدء تشغيل واجهة React...')
  
  viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5173'], {
    cwd: join(__dirname, '..', 'client'),
    stdio: 'pipe',
    shell: true
  })
  
  viteProcess.stdout.on('data', (data) => {
    const output = data.toString()
    if (output.includes('Local:') || output.includes('ready')) {
      console.log('✅ واجهة React جاهزة على http://localhost:5173')
    }
  })
  
  viteProcess.stderr.on('data', (data) => {
    const error = data.toString()
    if (!error.includes('warnings')) {
      console.log('⚠️ Vite:', error.trim())
    }
  })
}

// Serve static files for production
if (existsSync(join(__dirname, '..', 'dist', 'public'))) {
  app.use(express.static(join(__dirname, '..', 'dist', 'public')))
  
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'dist', 'public', 'index.html'))
  })
}

// Start the server
app.listen(PORT, () => {
  console.log(`🖥️ خادم API يعمل على: http://localhost:${PORT}`)
  console.log(`🔍 فحص الصحة: http://localhost:${PORT}/api/health`)
  console.log(`📊 لوحة التحكم: http://localhost:${PORT}/api/dashboard`)
  
  // Start Vite for development
  if (process.env.NODE_ENV !== 'production') {
    setTimeout(startViteServer, 2000)
  }
  
  console.log('\n🌐 الروابط المتاحة:')
  console.log('   📱 الواجهة (تطوير): http://localhost:5173')
  console.log('   🔧 API: http://localhost:3000')
  console.log('   📊 Dashboard API: http://localhost:3000/api/dashboard')
  console.log('\n💡 اضغط Ctrl+C لإيقاف الخادم')
})

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 إيقاف الخادم...')
  if (viteProcess) {
    viteProcess.kill()
  }
  process.exit(0)
})
