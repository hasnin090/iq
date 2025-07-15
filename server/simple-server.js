// سيرفر محلي مبسط للتطوير
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// محاولة تحميل cors إذا كانت متاحة
let cors;
try {
  cors = (await import('cors')).default;
} catch (error) {
  console.warn('cors package not found, using manual CORS setup');
}

// تحميل متغيرات البيئة
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
if (cors) {
  app.use(cors());
} else {
  // إعداد CORS يدوي
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تسجيل الطلبات
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// تقديم الملفات الثابتة
app.use(express.static(path.join(__dirname, 'public')));

// Routes للـ API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    supabase: {
      url: process.env.SUPABASE_URL,
      configured: !!process.env.SUPABASE_ANON_KEY
    }
  });
});

// Route لاختبار Supabase
app.get('/api/test-supabase', async (req, res) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(400).json({
        error: 'Supabase configuration missing',
        message: 'SUPABASE_URL and SUPABASE_ANON_KEY are required'
      });
    }
    
    // اختبار API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const data = await response.json();
    
    res.json({
      status: 'success',
      supabase_status: response.status,
      supabase_ok: response.ok,
      data_preview: Array.isArray(data) ? `${data.length} records` : 'data available'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Supabase test failed',
      message: error.message
    });
  }
});

// Route للحصول على المستخدمين
app.get('/api/users', async (req, res) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const users = await response.json();
    res.json(users);
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// Route للحصول على المشاريع
app.get('/api/projects', async (req, res) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const projects = await response.json();
    res.json(projects);
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch projects',
      message: error.message
    });
  }
});

// Route للحصول على المعاملات
app.get('/api/transactions', async (req, res) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const transactions = await response.json();
    res.json(transactions);
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message
    });
  }
});

// ✅ API endpoints مفقودة - إضافة جديدة
// Route للحصول على لوحة التحكم
app.get('/api/dashboard', async (req, res) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    
    // جلب الإحصائيات
    const [projectsRes, transactionsRes, employeesRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/projects?select=count`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'count=exact'
        }
      }),
      fetch(`${SUPABASE_URL}/rest/v1/transactions?select=type,amount`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }),
      fetch(`${SUPABASE_URL}/rest/v1/employees?select=count`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'count=exact'
        }
      })
    ]);

    const transactions = await transactionsRes.json();
    const projectsCount = projectsRes.headers.get('content-range')?.split('/')[1] || 0;
    const employeesCount = employeesRes.headers.get('content-range')?.split('/')[1] || 0;

    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    res.json({
      projectsCount: parseInt(projectsCount) || 0,
      transactionsCount: transactions.length || 0,
      employeesCount: parseInt(employeesCount) || 0,
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

// Route للحصول على الإعدادات
app.get('/api/settings', (req, res) => {
  res.json({
    appName: 'نظام إدارة شركة طريق العامرة',
    version: '1.0.0',
    language: 'ar',
    currency: 'SAR',
    dateFormat: 'YYYY-MM-DD',
    supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    features: {
      projects: true,
      transactions: true,
      employees: true,
      documents: true,
      reports: true
    }
  });
});

// Route للحصول على أنواع المصروفات
app.get('/api/expense-types', (req, res) => {
  res.json([
    { id: 'materials', name: 'مواد خام', category: 'materials' },
    { id: 'labor', name: 'عمالة', category: 'labor' },
    { id: 'equipment', name: 'معدات', category: 'equipment' },
    { id: 'transportation', name: 'نقل ومواصلات', category: 'transportation' },
    { id: 'utilities', name: 'خدمات عامة', category: 'utilities' },
    { id: 'maintenance', name: 'صيانة', category: 'maintenance' },
    { id: 'administrative', name: 'إدارية', category: 'administrative' },
    { id: 'other', name: 'أخرى', category: 'other' }
  ]);
});

// Route للحصول على الموظفين
app.get('/api/employees', async (req, res) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=*&is_active=eq.true&order=name.asc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const employees = await response.json();
    res.json(employees);
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch employees',
      message: error.message
    });
  }
});

// Route لإنشاء معاملة جديدة
app.post('/api/transactions', async (req, res) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(req.body)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      res.status(201).json(result);
    } else {
      res.status(response.status).json({
        error: 'Failed to create transaction',
        details: result
      });
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create transaction',
      message: error.message
    });
  }
});

// Route أساسي لتقديم التطبيق
app.get('*', (req, res) => {
  // إذا كان هناك index.html في مجلد public
  const indexPath = path.join(__dirname, 'public', 'index.html');
  
  // إذا لم يوجد، أرسل رسالة بسيطة
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>نظام المحاسبة العربي</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
            }
            .container {
                background: rgba(255,255,255,0.1);
                padding: 30px;
                border-radius: 15px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            }
            h1 { text-align: center; margin-bottom: 30px; }
            .status { 
                background: rgba(255,255,255,0.2); 
                padding: 15px; 
                border-radius: 10px; 
                margin: 10px 0;
            }
            .success { border-left: 4px solid #4CAF50; }
            .info { border-left: 4px solid #2196F3; }
            .api-links {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }
            .api-link {
                display: block;
                padding: 15px;
                background: rgba(255,255,255,0.2);
                text-decoration: none;
                color: white;
                border-radius: 10px;
                text-align: center;
                transition: all 0.3s ease;
            }
            .api-link:hover {
                background: rgba(255,255,255,0.3);
                transform: translateY(-2px);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 نظام المحاسبة العربي</h1>
            
            <div class="status success">
                <strong>✅ السيرفر يعمل بنجاح!</strong><br>
                المنفذ: ${PORT}<br>
                الوقت: ${new Date().toLocaleString('ar')}
            </div>
            
            <div class="status info">
                <strong>🔧 إعدادات Supabase:</strong><br>
                URL: ${process.env.SUPABASE_URL || 'غير محدد'}<br>
                ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'مُعدّ ✅' : 'غير مُعدّ ❌'}
            </div>
            
            <h2>🔗 روابط API المتاحة:</h2>
            <div class="api-links">
                <a href="/api/health" class="api-link">
                    <strong>فحص الصحة</strong><br>
                    /api/health
                </a>
                <a href="/api/test-supabase" class="api-link">
                    <strong>اختبار Supabase</strong><br>
                    /api/test-supabase
                </a>
                <a href="/api/users" class="api-link">
                    <strong>المستخدمون</strong><br>
                    /api/users
                </a>
                <a href="/api/projects" class="api-link">
                    <strong>المشاريع</strong><br>
                    /api/projects
                </a>
                <a href="/api/transactions" class="api-link">
                    <strong>المعاملات</strong><br>
                    /api/transactions
                </a>
                <a href="/api/dashboard" class="api-link">
                    <strong>لوحة التحكم</strong><br>
                    /api/dashboard
                </a>
                <a href="/api/settings" class="api-link">
                    <strong>الإعدادات</strong><br>
                    /api/settings
                </a>
                <a href="/api/expense-types" class="api-link">
                    <strong>أنواع المصروفات</strong><br>
                    /api/expense-types
                </a>
                <a href="/api/employees" class="api-link">
                    <strong>الموظفون</strong><br>
                    /api/employees
                </a>
            </div>
            
            <div style="margin-top: 30px; text-align: center; font-size: 14px; opacity: 0.8;">
                نظام المحاسبة العربي - ${process.env.VITE_APP_VERSION || '1.0.0'}
            </div>
        </div>
    </body>
    </html>
  `);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`
🚀 السيرفر يعمل بنجاح!
📍 العنوان: http://localhost:${PORT}
🕐 الوقت: ${new Date().toLocaleString('ar')}
🔧 البيئة: ${process.env.NODE_ENV || 'development'}
📊 Supabase: ${process.env.SUPABASE_URL ? '✅ مُعدّ' : '❌ غير مُعدّ'}
  `);
  
  console.log('\n📋 الروابط المتاحة:');
  console.log(`   🏠 الصفحة الرئيسية: http://localhost:${PORT}`);
  console.log(`   🔍 فحص الصحة: http://localhost:${PORT}/api/health`);
  console.log(`   🧪 اختبار Supabase: http://localhost:${PORT}/api/test-supabase`);
  console.log(`   👥 المستخدمون: http://localhost:${PORT}/api/users`);
  console.log(`   📊 المشاريع: http://localhost:${PORT}/api/projects`);
  console.log(`   💰 المعاملات: http://localhost:${PORT}/api/transactions`);
  console.log(`   📊 لوحة التحكم: http://localhost:${PORT}/api/dashboard`);
  console.log(`   ⚙️ الإعدادات: http://localhost:${PORT}/api/settings`);
  console.log(`   💼 أنواع المصروفات: http://localhost:${PORT}/api/expense-types`);
  console.log(`   👤 الموظفون: http://localhost:${PORT}/api/employees`);
  console.log('\n💡 اضغط Ctrl+C لإيقاف السيرفر');
});

export default app;
