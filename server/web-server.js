import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3000

console.log('🚀 نظام المحاسبة العربي - شركة طريق العامرة')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// Middleware
app.use(express.json())
app.use(express.static(join(__dirname, '..', 'client')))

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'خادم نظام المحاسبة يعمل بنجاح',
    timestamp: new Date().toLocaleString('ar-IQ'),
    version: '1.0.0'
  })
})

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
      count: data?.length || 0,
      message: `تم استرجاع ${data?.length || 0} مشروع`
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطأ في استرجاع المشاريع',
      error: error.message
    })
  }
})

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
      count: data?.length || 0,
      message: `تم استرجاع ${data?.length || 0} نوع مصروف`
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطأ في استرجاع أنواع المصروفات',
      error: error.message
    })
  }
})

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  const indexPath = join(__dirname, '..', 'client', 'index.html')
  if (existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.send(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>نظام المحاسبة العربي</title>
        <style>
          body { font-family: Cairo, Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #2563eb; margin-bottom: 30px; }
          .status { background: #dcfce7; border: 1px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .api-list { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .api-item { padding: 10px; margin: 5px 0; background: white; border-radius: 5px; border-left: 4px solid #2563eb; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
          a { color: #2563eb; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏢 نظام المحاسبة العربي</h1>
            <h2>شركة طريق العامرة</h2>
          </div>
          
          <div class="status">
            <h3>✅ الخادم يعمل بنجاح!</h3>
            <p>الوقت: ${new Date().toLocaleString('ar-IQ')}</p>
            <p>المنفذ: ${PORT}</p>
          </div>
          
          <div class="api-list">
            <h3>🔗 المسارات المتاحة:</h3>
            <div class="api-item">
              <strong>فحص الصحة:</strong> 
              <a href="/api/health" target="_blank">/api/health</a>
            </div>
            <div class="api-item">
              <strong>المشاريع:</strong> 
              <a href="/api/projects" target="_blank">/api/projects</a>
            </div>
            <div class="api-item">
              <strong>أنواع المصروفات:</strong> 
              <a href="/api/expense-types" target="_blank">/api/expense-types</a>
            </div>
          </div>
          
          <div class="footer">
            <p>🚀 نظام محاسبة شامل مع Supabase</p>
            <p>تطوير: نظام المحاسبة العربي 2025</p>
          </div>
        </div>
      </body>
      </html>
    `)
  }
})

app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على: http://localhost:${PORT}`)
  console.log(`🔍 فحص الصحة: http://localhost:${PORT}/api/health`)
  console.log(`📊 المشاريع: http://localhost:${PORT}/api/projects`)
  console.log(`💰 أنواع المصروفات: http://localhost:${PORT}/api/expense-types`)
  console.log('')
  console.log('🌐 افتح المتصفح على: http://localhost:3000')
  console.log('💡 اضغط Ctrl+C لإيقاف الخادم')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
})
