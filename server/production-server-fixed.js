// سيرفر الإنتاج النهائي - نظام المحاسبة العربي
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// تحميل متغيرات البيئة
dotenv.config();

// إعداد المسارات
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إعداد Express
const app = express();
const PORT = process.env.PORT || 3000; // استخدام port 3000 بدلاً من 5000
const NODE_ENV = process.env.NODE_ENV || 'development';

// إعداد Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CORS Setup (بدون استخدام مكتبة خارجية)
app.use((req, res, next) => {
  const allowedOrigins = NODE_ENV === 'production' 
    ? ['https://your-domain.com', 'https://your-app.netlify.app']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('user-agent') || 'Unknown';
  
  console.log(`[${timestamp}] ${method} ${url} - ${userAgent.substring(0, 100)}`);
  next();
});

// Rate limiting (simple implementation)
const requestCounts = new Map();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
  } else {
    const record = requestCounts.get(ip);
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + RATE_WINDOW;
    } else {
      record.count++;
      if (record.count > RATE_LIMIT) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
      }
    }
  }
  
  next();
});

// Static files
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
} else {
  app.use(express.static(path.join(__dirname, '../client/public')));
}

// Utility functions
function handleAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function validateRequired(fields) {
  return (req, res, next) => {
    const missing = fields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing: missing
      });
    }
    next();
  };
}

// ===== API ROUTES =====

// Health check
app.get('/api/health', handleAsync(async (req, res) => {
  try {
    const { data: healthCheck } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true });
    
    res.json({
      status: 'OK',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      version: process.env.VITE_APP_VERSION || '1.0.0',
      supabase: {
        url: process.env.SUPABASE_URL,
        configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
        connection: healthCheck !== undefined ? 'connected' : 'disconnected'
      },
      features: {
        cors: true,
        rateLimit: true,
        security: true
      }
    });
  } catch (error) {
    res.json({
      status: 'OK',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      version: process.env.VITE_APP_VERSION || '1.0.0',
      supabase: {
        url: process.env.SUPABASE_URL,
        configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
        connection: 'error'
      },
      features: {
        cors: true,
        rateLimit: true,
        security: true
      },
      error: NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// Test Supabase connection
app.get('/api/test-supabase', handleAsync(async (req, res) => {
  const tests = {
    connection: false,
    tables: {},
    storage: false,
    auth: false
  };
  
  try {
    // اختبار الاتصال الأساسي
    const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact', head: true });
    tests.connection = !error;
    
    // اختبار الجداول
    const tables = ['users', 'projects', 'transactions'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count(*)', { count: 'exact', head: true });
        tests.tables[table] = !error;
      } catch (err) {
        tests.tables[table] = false;
      }
    }
    
    // اختبار التخزين
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      tests.storage = !!buckets;
    } catch (err) {
      tests.storage = false;
    }
    
    // اختبار المصادقة
    try {
      const { data: authData } = await supabase.auth.getSession();
      tests.auth = true;
    } catch (err) {
      tests.auth = false;
    }
    
  } catch (error) {
    console.error('Supabase test error:', error);
  }
  
  res.json({
    status: 'success',
    tests: tests,
    overall: Object.values(tests).every(test => 
      typeof test === 'boolean' ? test : Object.values(test).every(t => t)
    )
  });
}));

// ===== USERS API =====
app.get('/api/users', handleAsync(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  res.json(data);
}));

app.post('/api/users', validateRequired(['name', 'email']), handleAsync(async (req, res) => {
  const { name, email, role = 'user' } = req.body;
  
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, role }])
    .select()
    .single();
  
  if (error) throw error;
  res.status(201).json(data);
}));

app.put('/api/users/:id', handleAsync(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  res.json(data);
}));

app.delete('/api/users/:id', handleAsync(async (req, res) => {
  const { id } = req.params;
  
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  res.json({ message: 'User deleted successfully' });
}));

// ===== PROJECTS API =====
app.get('/api/projects', handleAsync(async (req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  res.json(data);
}));

app.post('/api/projects', validateRequired(['name']), handleAsync(async (req, res) => {
  const projectData = req.body;
  
  const { data, error } = await supabase
    .from('projects')
    .insert([projectData])
    .select()
    .single();
  
  if (error) throw error;
  res.status(201).json(data);
}));

app.put('/api/projects/:id', handleAsync(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  res.json(data);
}));

app.delete('/api/projects/:id', handleAsync(async (req, res) => {
  const { id } = req.params;
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  res.json({ message: 'Project deleted successfully' });
}));

// ===== TRANSACTIONS API =====
app.get('/api/transactions', handleAsync(async (req, res) => {
  const { project_id, user_id, limit = 50, offset = 0 } = req.query;
  
  let query = supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (project_id) query = query.eq('project_id', project_id);
  if (user_id) query = query.eq('user_id', user_id);
  
  const { data, error } = await query;
  
  if (error) throw error;
  res.json(data);
}));

app.post('/api/transactions', validateRequired(['amount', 'type']), handleAsync(async (req, res) => {
  const transactionData = req.body;
  
  const { data, error } = await supabase
    .from('transactions')
    .insert([transactionData])
    .select()
    .single();
  
  if (error) throw error;
  res.status(201).json(data);
}));

app.put('/api/transactions/:id', handleAsync(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  res.json(data);
}));

app.delete('/api/transactions/:id', handleAsync(async (req, res) => {
  const { id } = req.params;
  
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  res.json({ message: 'Transaction deleted successfully' });
}));

// ===== STATISTICS API =====
app.get('/api/statistics', handleAsync(async (req, res) => {
  try {
    const [usersCount, projectsCount, transactionsCount] = await Promise.all([
      supabase.from('users').select('count(*)', { count: 'exact', head: true }),
      supabase.from('projects').select('count(*)', { count: 'exact', head: true }),
      supabase.from('transactions').select('count(*)', { count: 'exact', head: true })
    ]);
    
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('amount, type, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    const totalIncome = recentTransactions
      ?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    
    const totalExpenses = recentTransactions
      ?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    
    res.json({
      users: usersCount.count || 0,
      projects: projectsCount.count || 0,
      transactions: transactionsCount.count || 0,
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      recentTransactions: recentTransactions || []
    });
  } catch (error) {
    res.json({
      users: 0,
      projects: 0,
      transactions: 0,
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      recentTransactions: [],
      error: NODE_ENV === 'development' ? error.message : 'Unable to fetch statistics'
    });
  }
}));

// ===== FILE UPLOAD API =====
app.post('/api/upload', handleAsync(async (req, res) => {
  res.json({ 
    message: 'File upload endpoint - requires multer implementation',
    note: 'This endpoint needs to be implemented with multer for actual file handling'
  });
}));

// ===== CATCH-ALL ROUTE =====
app.get('*', (req, res) => {
  const indexPath = NODE_ENV === 'production' 
    ? path.join(__dirname, '../client/dist/index.html')
    : path.join(__dirname, '../client/public/index.html');
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Page not found' });
    }
  });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ===== SERVER STARTUP =====
const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 نظام المحاسبة العربي - سيرفر الإنتاج');
  console.log('='.repeat(60));
  console.log(`📍 العنوان: http://localhost:${PORT}`);
  console.log(`🕐 بدء التشغيل: ${new Date().toLocaleString('ar-EG')}`);
  console.log(`🔧 البيئة: ${NODE_ENV}`);
  console.log(`📊 Supabase: ${process.env.SUPABASE_URL ? '✅ مُعدّ' : '❌ غير مُعدّ'}`);
  console.log(`🔒 الحماية: ✅ CORS | Rate Limiting | Security Headers`);
  console.log(`📦 الإصدار: ${process.env.VITE_APP_VERSION || '1.0.0'}`);
  console.log('='.repeat(60));
  
  console.log('\n📋 API المتاحة:');
  console.log('   🔍 فحص الصحة: /api/health');
  console.log('   🧪 اختبار Supabase: /api/test-supabase');
  console.log('   📊 إحصائيات: /api/statistics');
  console.log('   👥 المستخدمون: /api/users');
  console.log('   📊 المشاريع: /api/projects');
  console.log('   💰 المعاملات: /api/transactions');
  console.log('   📁 رفع الملفات: /api/upload');
  
  console.log('\n💡 لإيقاف السيرفر: Ctrl+C');
  console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 إيقاف السيرفر...');
  server.close(() => {
    console.log('✅ تم إيقاف السيرفر بنجاح');
    process.exit(0);
  });
});

export default app;
