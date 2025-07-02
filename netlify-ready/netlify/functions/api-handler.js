// Netlify Function - معالج API رئيسي
const { neon } = require('@neondatabase/serverless');

// معلومات الجلسات في الذاكرة
const sessions = new Map();

// معالج بسيط للكوكيز
function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length === 2) {
        cookies[parts[0]] = decodeURIComponent(parts[1]);
      }
    });
  }
  return cookies;
}

// إنشاء جلسة
function createSession(userId, username, role, name, permissions) {
  const sessionId = 'sess_' + Math.random().toString(36).substr(2, 15);
  const session = {
    userId,
    username,
    role,
    name,
    permissions,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 ساعة
  };
  sessions.set(sessionId, session);
  return sessionId;
}

// جلب الجلسة
function getSession(sessionId) {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session || Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

// معالج Netlify
exports.handler = async (event, context) => {
  // إزالة أي "1" مضاف للمسار
  let path = event.path
    .replace('/.netlify/functions/api-handler', '')
    .replace(/1$/, ''); // إزالة "1" من نهاية المسار
  
  const method = event.httpMethod;
  const cookies = parseCookies(event.headers.cookie);
  
  console.log('معالج API - المسار:', path, 'الطريقة:', method);
  
  // رؤوس CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': event.headers.origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  };
  
  // معالجة OPTIONS
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  try {
    // مسار تسجيل الدخول
    if (path === '/auth/login' && method === 'POST') {
      const body = JSON.parse(event.body);
      const { username, password } = body;
      
      console.log('محاولة دخول لـ:', username);
      
      if (!username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "اسم المستخدم وكلمة المرور مطلوبان" })
        };
      }
      
      // دخول المشرف
      if (username === 'admin' && password === 'admin123') {
        const permissions = [
          'view_dashboard', 'manage_users', 'view_users', 'manage_projects',
          'view_projects', 'manage_project_transactions', 'view_project_transactions',
          'manage_transactions', 'view_transactions', 'manage_documents',
          'view_documents', 'view_reports', 'view_activity_logs', 'manage_settings'
        ];
        
        const sessionId = createSession(1, 'admin', 'admin', 'مدير النظام', permissions);
        
        // تعيين كوكيز الجلسة
        const setCookie = `connect.sid=${sessionId}; HttpOnly; Max-Age=86400; Path=/; SameSite=Lax`;
        
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Set-Cookie': setCookie
          },
          body: JSON.stringify({
            id: 1,
            username: 'admin',
            name: 'مدير النظام',
            email: 'admin@example.com',
            role: 'admin',
            permissions: permissions,
            active: true
          })
        };
      }
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "اسم المستخدم أو كلمة المرور غير صحيح" })
      };
    }
    
    // فحص الجلسة
    if (path === '/auth/session' && method === 'GET') {
      const sessionId = cookies['connect.sid'];
      const session = getSession(sessionId);
      
      console.log('فحص الجلسة:', { sessionId, hasSession: !!session });
      
      if (!session) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: "غير مصرح" })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: session.userId,
          username: session.username,
          name: session.name,
          role: session.role,
          permissions: session.permissions
        })
      };
    }
    
    // تسجيل الخروج
    if (path === '/auth/logout' && method === 'POST') {
      const sessionId = cookies['connect.sid'];
      if (sessionId) {
        sessions.delete(sessionId);
      }
      
      const clearCookie = 'connect.sid=; HttpOnly; Max-Age=0; Path=/; SameSite=Lax';
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Set-Cookie': clearCookie
        },
        body: JSON.stringify({ message: "تم تسجيل الخروج بنجاح" })
      };
    }
    
    // حالة قاعدة البيانات
    if (path === '/database/status' && method === 'GET') {
      try {
        const sql = neon(process.env.DATABASE_URL);
        
        const startTime = Date.now();
        await sql`SELECT 1`;
        const responseTime = Date.now() - startTime;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            connected: true,
            responseTime,
            timestamp: new Date().toISOString()
          })
        };
      } catch (error) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            connected: false,
            error: 'Database connection failed',
            timestamp: new Date().toISOString()
          })
        };
      }
    }
    
    // المسارات المحمية - فحص الجلسة
    const sessionId = cookies['connect.sid'];
    const session = getSession(sessionId);
    
    if (!session) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "غير مصرح" })
      };
    }
    
    // لوحة التحكم
    if (path === '/dashboard' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          totalIncome: 4356000000,
          totalExpenses: 394000000,
          netProfit: 3962000000,
          activeProjects: 15,
          pendingTransactions: 5,
          completedTransactions: 234,
          totalUsers: 3,
          systemHealth: 'جيد'
        })
      };
    }
    
    // الإعدادات
    if (path === '/settings' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          { id: 9, key: 'companyName', value: 'شركة العراق للمقاولات' },
          { id: 10, key: 'companyAddress', value: 'بغداد، العراق' },
          { id: 11, key: 'companyPhone', value: '+964 770 123 4567' },
          { id: 12, key: 'companyEmail', value: 'info@iraq-construction.com' },
          { id: 13, key: 'currency', value: 'دينار عراقي' },
          { id: 14, key: 'fiscalYearStart', value: '01-01' },
          { id: 15, key: 'taxRate', value: '15' },
          { id: 16, key: 'dateFormat', value: 'DD/MM/YYYY' }
        ])
      };
    }
    
    // المستخدمون
    if (path === '/users' && method === 'GET') {
      if (!session.permissions.includes('view_users')) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ message: 'ليس لديك صلاحية للوصول' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          {
            id: 1,
            username: 'admin',
            name: 'مدير النظام',
            email: 'admin@example.com',
            role: 'admin',
            active: true
          }
        ])
      };
    }
    
    // المشاريع  
    if (path === '/projects' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          {
            id: 37,
            name: 'مشروع تجريبي محدث',
            description: 'مشروع تجريبي لاختبار النظام - تم التحديث',
            status: 'active',
            totalIncome: 10000000,
            totalExpenses: 2500000,
            balance: 7500000,
            budget: 15000000,
            spent: 2500000
          }
        ])
      };
    }
    
    // المعاملات
    if (path === '/transactions' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          {
            id: 764,
            date: '2025-07-02',
            type: 'expense',
            amount: 5000000,
            description: 'دفعة مستحقة - ثرمستون',
            projectId: 36,
            expenseTypeId: 32
          }
        ])
      };
    }
    
    // أنواع المصروفات
    if (path === '/expense-types' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          {
            id: 13,
            name: 'اجور تشغيلية',
            description: 'أجور العمال والمشغلين',
            is_active: true
          },
          {
            id: 31,
            name: 'احمد',
            description: null,
            is_active: true
          },
          {
            id: 30,
            name: 'اوفر تايم',
            description: null,
            is_active: true
          }
        ])
      };
    }
    
    // الموظفون
    if (path === '/employees' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          {
            id: 8,
            name: 'موظف تجريبي',
            salary: 300000,
            assignedProjectId: 30,
            active: true
          },
          {
            id: 7,
            name: 'محمد',
            salary: 250000,
            assignedProjectId: 30,
            active: true
          }
        ])
      };
    }
    
    // افتراضي 404
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        message: 'المسار غير موجود',
        path: path,
        originalPath: event.path
      })
    };
    
  } catch (error) {
    console.error('خطأ API:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'خطأ في الخادم',
        error: error.message 
      })
    };
  }
};