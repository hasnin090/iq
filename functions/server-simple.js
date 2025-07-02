import express from 'express';
import { neon } from '@neondatabase/serverless';
import serverless from 'serverless-http';

const app = express();
const sql = neon(process.env.DATABASE_URL);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Simple cookie parser implementation
function parseCookies(req) {
  const cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length === 2) {
        cookies[parts[0]] = decodeURIComponent(parts[1]);
      }
    });
  }
  return cookies;
}

// Add cookies to req object
app.use((req, res, next) => {
  req.cookies = parseCookies(req);
  next();
});

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-memory session store for Netlify
const sessions = new Map();

function createSession(userId, username, role, name, permissions) {
  const sessionId = 'sess_' + Math.random().toString(36).substr(2, 15);
  const session = {
    userId,
    username,
    role,
    name,
    permissions: permissions || [],
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  sessions.set(sessionId, session);
  return sessionId;
}

function getSession(sessionId) {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session || Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

// Authentication middleware
const authenticate = (req, res, next) => {
  const sessionId = req.cookies['connect.sid'] || req.headers['x-session-id'];
  const session = getSession(sessionId);
  
  if (!session) {
    return res.status(401).json({ message: "غير مصرح" });
  }
  
  req.session = { userId: session.userId, username: session.username, role: session.role };
  req.user = session;
  next();
};

// Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt for:', username);
    
    if (!username || !password) {
      return res.status(400).json({ message: "اسم المستخدم وكلمة المرور مطلوبان" });
    }

    // Admin login
    if (username === 'admin' && password === 'admin123') {
      const permissions = [
        'view_dashboard', 'manage_users', 'view_users', 'manage_projects',
        'view_projects', 'manage_project_transactions', 'view_project_transactions',
        'manage_transactions', 'view_transactions', 'manage_documents',
        'view_documents', 'view_reports', 'view_activity_logs', 'manage_settings'
      ];
      
      const sessionId = createSession(1, 'admin', 'admin', 'مدير النظام', permissions);
      
      // Set session cookie
      res.cookie('connect.sid', sessionId, {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      });
      
      console.log('Admin login successful, session created:', sessionId);
      
      return res.json({
        id: 1,
        username: 'admin',
        name: 'مدير النظام',
        email: 'admin@example.com',
        role: 'admin',
        permissions: permissions,
        active: true
      });
    }

    // Check database for other users
    try {
      const userResult = await sql`SELECT * FROM users WHERE username = ${username} AND active = true`;
      if (userResult.length === 0) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيح" });
      }

      const user = userResult[0];
      
      // Simple password check (in production, use bcrypt)
      if (user.password !== password) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيح" });
      }

      const sessionId = createSession(user.id, user.username, user.role, user.name, user.permissions || []);
      
      res.cookie('connect.sid', sessionId, {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      });
      
      return res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email || '',
        role: user.role,
        permissions: user.permissions || [],
        active: user.active
      });
      
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      // Fallback for database issues
      return res.status(500).json({ message: "خطأ في قاعدة البيانات" });
    }
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: "خطأ في تسجيل الدخول" });
  }
});

app.get('/api/auth/session', (req, res) => {
  const sessionId = req.cookies['connect.sid'];
  const session = getSession(sessionId);
  
  console.log('Session check:', { sessionId, hasSession: !!session });
  
  if (!session) {
    return res.status(401).json({ message: "غير مصرح" });
  }
  
  res.json({
    id: session.userId,
    username: session.username,
    name: session.name,
    role: session.role,
    permissions: session.permissions || []
  });
});

app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.cookies['connect.sid'];
  if (sessionId) {
    sessions.delete(sessionId);
    res.clearCookie('connect.sid');
  }
  res.json({ message: "تم تسجيل الخروج بنجاح" });
});

// Database status
app.get('/api/database/status', async (req, res) => {
  try {
    const startTime = Date.now();
    await sql`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    res.json({
      connected: true,
      responseTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Dashboard data
app.get('/api/dashboard', authenticate, async (req, res) => {
  try {
    // Get real dashboard data from database
    const [incomeResult, expenseResult, projectsResult, transactionsResult] = await Promise.all([
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'`,
      sql`SELECT COUNT(*) as count FROM projects WHERE status = 'active'`,
      sql`SELECT COUNT(*) as pending, COUNT(*) as completed FROM transactions`
    ]);

    const totalIncome = Number(incomeResult[0]?.total || 0);
    const totalExpenses = Number(expenseResult[0]?.total || 0);
    const activeProjects = Number(projectsResult[0]?.count || 0);

    res.json({
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      activeProjects,
      pendingTransactions: 0,
      completedTransactions: Number(transactionsResult[0]?.completed || 0),
      totalUsers: 3,
      systemHealth: 'جيد'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'خطأ في جلب بيانات لوحة التحكم' });
  }
});

// Projects endpoint
app.get('/api/projects', authenticate, async (req, res) => {
  try {
    const projects = await sql`
      SELECT id, name, description, budget, spent, status, 
             start_date as "startDate", end_date as "endDate", 
             created_at as "createdAt"
      FROM projects 
      ORDER BY created_at DESC
    `;
    res.json(projects);
  } catch (error) {
    console.error('Projects error:', error);
    res.json([]);
  }
});

// Settings endpoint
app.get('/api/settings', authenticate, async (req, res) => {
  try {
    const settings = await sql`SELECT id, key, value FROM settings ORDER BY id`;
    res.json(settings);
  } catch (error) {
    console.error('Settings error:', error);
    res.json([
      { id: 1, key: 'companyName', value: 'شركة العراق للمقاولات' },
      { id: 2, key: 'companyAddress', value: 'بغداد، العراق' }
    ]);
  }
});

// Users endpoint
app.get('/api/users', authenticate, async (req, res) => {
  try {
    const users = await sql`
      SELECT id, username, name, email, role, permissions, active
      FROM users 
      ORDER BY created_at DESC
    `;
    res.json(users);
  } catch (error) {
    console.error('Users error:', error);
    res.json([]);
  }
});

// Transactions endpoint
app.get('/api/transactions', authenticate, async (req, res) => {
  try {
    const transactions = await sql`
      SELECT t.*, p.name as project_name, et.name as expense_type_name
      FROM transactions t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN expense_types et ON t.expense_type_id = et.id
      ORDER BY t.created_at DESC
      LIMIT 100
    `;
    res.json(transactions);
  } catch (error) {
    console.error('Transactions error:', error);
    res.json([]);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404 for path:', req.originalUrl);
  res.status(404).json({ message: 'Route not found' });
});

// Export for Netlify
export const handler = serverless(app);