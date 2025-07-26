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

// Route للواجهة الرئيسية
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نظام المحاسبة العربي - شركة طريق العامرة</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            direction: rtl;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .status-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .api-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .api-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .api-card:hover {
            transform: translateY(-5px);
        }
        
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin: 5px;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-family: 'Cairo', sans-serif;
        }
        
        .btn:hover {
            background: #5a67d8;
            transform: translateY(-2px);
        }
        
        .btn-success { background: #48bb78; }
        .btn-info { background: #4299e1; }
        .btn-warning { background: #ed8936; }
        
        .result {
            background: #f7fafc;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            border-right: 4px solid #667eea;
            font-family: 'Courier New', monospace;
            max-height: 300px;
            overflow-y: auto;
            font-size: 12px;
        }
        
        .success { border-right-color: #48bb78; background: #f0fff4; }
        .error { border-right-color: #f56565; background: #fff5f5; }
        .loading { color: #667eea; }
        
        h1 {
            color: #2d3748;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        
        h3 {
            color: #2d3748;
            margin-bottom: 15px;
            font-size: 1.2em;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-left: 8px;
        }
        
        .status-online { background: #48bb78; }
        .status-offline { background: #f56565; }
        
        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .stat-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #e2e8f0;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            color: #718096;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 نظام المحاسبة العربي</h1>
            <p style="font-size: 1.2em; color: #718096; margin-top: 10px;">شركة طريق العامرة</p>
            <p style="color: #48bb78; margin-top: 15px;">
                <i class="fas fa-server"></i> الخادم متصل ويعمل بنجاح
                <span class="status-indicator status-online"></span>
            </p>
        </div>
        
        <div class="status-card">
            <h3>📊 لوحة التحكم السريعة</h3>
            <div id="dashboard-stats" class="stats-row">
                <div class="stat-box">
                    <div class="stat-number" id="projects-count">-</div>
                    <div class="stat-label">إجمالي المشاريع</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number" id="transactions-count">-</div>
                    <div class="stat-label">إجمالي المعاملات</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number" id="employees-count">-</div>
                    <div class="stat-label">عدد الموظفين</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number" id="expense-types-count">-</div>
                    <div class="stat-label">أنواع المصروفات</div>
                </div>
            </div>
        </div>
        
        <div class="api-grid">
            <div class="api-card">
                <h3><i class="fas fa-heartbeat"></i> فحص حالة النظام</h3>
                <button class="btn btn-success" onclick="testEndpoint('/api/health', 'health-result')">
                    اختبار الآن
                </button>
                <a href="/api/health" target="_blank" class="btn btn-info">عرض JSON</a>
                <div id="health-result" class="result" style="display: none;"></div>
            </div>
            
            <div class="api-card">
                <h3><i class="fas fa-database"></i> قاعدة البيانات</h3>
                <button class="btn btn-success" onclick="testEndpoint('/api/test-supabase', 'db-result')">
                    اختبار الاتصال
                </button>
                <a href="/api/test-supabase" target="_blank" class="btn btn-info">عرض JSON</a>
                <div id="db-result" class="result" style="display: none;"></div>
            </div>
            
            <div class="api-card">
                <h3><i class="fas fa-chart-bar"></i> لوحة التحكم</h3>
                <button class="btn btn-success" onclick="testEndpoint('/api/dashboard', 'dashboard-result')">
                    اختبار البيانات
                </button>
                <a href="/api/dashboard" target="_blank" class="btn btn-info">عرض JSON</a>
                <div id="dashboard-result" class="result" style="display: none;"></div>
            </div>
            
            <div class="api-card">
                <h3><i class="fas fa-project-diagram"></i> المشاريع</h3>
                <button class="btn btn-success" onclick="testEndpoint('/api/projects', 'projects-result')">
                    جلب المشاريع
                </button>
                <a href="/api/projects" target="_blank" class="btn btn-info">عرض JSON</a>
                <div id="projects-result" class="result" style="display: none;"></div>
            </div>
            
            <div class="api-card">
                <h3><i class="fas fa-exchange-alt"></i> المعاملات المالية</h3>
                <button class="btn btn-success" onclick="testEndpoint('/api/transactions', 'transactions-result')">
                    جلب المعاملات
                </button>
                <a href="/api/transactions" target="_blank" class="btn btn-info">عرض JSON</a>
                <div id="transactions-result" class="result" style="display: none;"></div>
            </div>
            
            <div class="api-card">
                <h3><i class="fas fa-users"></i> الموظفون</h3>
                <button class="btn btn-success" onclick="testEndpoint('/api/employees', 'employees-result')">
                    جلب الموظفين
                </button>
                <a href="/api/employees" target="_blank" class="btn btn-info">عرض JSON</a>
                <div id="employees-result" class="result" style="display: none;"></div>
            </div>
        </div>
        
        <div class="status-card">
            <h3>🔗 روابط سريعة للمطورين</h3>
            <a href="/api/health" target="_blank" class="btn">فحص الصحة</a>
            <a href="/api/dashboard" target="_blank" class="btn">لوحة التحكم</a>
            <a href="/api/projects" target="_blank" class="btn">المشاريع</a>
            <a href="/api/transactions" target="_blank" class="btn">المعاملات</a>
            <a href="/api/employees" target="_blank" class="btn">الموظفون</a>
            <a href="/api/expense-types" target="_blank" class="btn">أنواع المصروفات</a>
            <a href="/api/users" target="_blank" class="btn">المستخدمون</a>
        </div>
    </div>
    
    <script>
        async function testEndpoint(endpoint, resultId) {
            const resultDiv = document.getElementById(resultId);
            resultDiv.style.display = 'block';
            resultDiv.className = 'result loading';
            resultDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الاختبار...';
            
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                
                resultDiv.className = response.ok ? 'result success' : 'result error';
                resultDiv.innerHTML = \`
                    <div style="margin-bottom: 10px;">
                        <strong>حالة الاستجابة:</strong> \${response.status} \${response.ok ? '✅' : '❌'}
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong>البيانات المستلمة:</strong>
                    </div>
                    <pre>\${JSON.stringify(data, null, 2)}</pre>
                \`;
                
                // تحديث الإحصائيات إذا كانت من لوحة التحكم
                if (endpoint === '/api/dashboard' && response.ok) {
                    updateDashboardStats(data);
                }
                
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = \`
                    <div style="color: #f56565;">
                        <strong>❌ خطأ في الاتصال:</strong><br>
                        \${error.message}
                    </div>
                \`;
            }
        }
        
        function updateDashboardStats(data) {
            if (data.projects_count !== undefined) {
                document.getElementById('projects-count').textContent = data.projects_count;
            }
            if (data.transactions_count !== undefined) {
                document.getElementById('transactions-count').textContent = data.transactions_count;
            }
            if (data.employees_count !== undefined) {
                document.getElementById('employees-count').textContent = data.employees_count;
            }
            if (data.expense_types_count !== undefined) {
                document.getElementById('expense-types-count').textContent = data.expense_types_count;
            }
        }
        
        // تحميل إحصائيات سريعة عند تحميل الصفحة
        async function loadQuickStats() {
            try {
                // جلب عدد المشاريع
                const projectsRes = await fetch('/api/projects');
                if (projectsRes.ok) {
                    const projects = await projectsRes.json();
                    document.getElementById('projects-count').textContent = Array.isArray(projects) ? projects.length : '0';
                }
                
                // جلب عدد المعاملات
                const transactionsRes = await fetch('/api/transactions');
                if (transactionsRes.ok) {
                    const transactions = await transactionsRes.json();
                    document.getElementById('transactions-count').textContent = Array.isArray(transactions) ? transactions.length : '0';
                }
                
                // جلب عدد الموظفين
                const employeesRes = await fetch('/api/employees');
                if (employeesRes.ok) {
                    const employees = await employeesRes.json();
                    document.getElementById('employees-count').textContent = Array.isArray(employees) ? employees.length : '0';
                }
                
                // جلب عدد أنواع المصروفات
                const expenseTypesRes = await fetch('/api/expense-types');
                if (expenseTypesRes.ok) {
                    const expenseTypes = await expenseTypesRes.json();
                    document.getElementById('expense-types-count').textContent = Array.isArray(expenseTypes) ? expenseTypes.length : '0';
                }
                
            } catch (error) {
                console.log('خطأ في تحميل الإحصائيات:', error);
            }
        }
        
        // تحميل الإحصائيات عند تحميل الصفحة
        loadQuickStats();
        
        console.log('🎉 نظام المحاسبة العربي - شركة طريق العامرة');
        console.log('🌐 الخادم: http://localhost:5000');
        console.log('📊 API متاح ويعمل بنجاح');
    </script>
</body>
</html>
  `);
});

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
