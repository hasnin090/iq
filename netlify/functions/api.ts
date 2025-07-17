// Demo users for development/testing
const demoUsers = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'المدير العام',
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['manage_all', 'view_reports', 'manage_users']
  },
  {
    id: 2,
    username: 'manager',
    password: 'manager123',
    name: 'مدير المشاريع',
    email: 'manager@example.com',
    role: 'manager',
    permissions: ['view_reports', 'manage_projects']
  },
  {
    id: 3,
    username: 'user',
    password: 'user123',
    name: 'المستخدم العادي',
    email: 'user@example.com',
    role: 'user',
    permissions: ['view_basic']
  }
];

// Netlify Functions API handler (JavaScript version)
const handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Route handling
  const path = event.path.replace('/.netlify/functions/api', '');
  
  console.log('API Request:', {
    method: event.httpMethod,
    path: path,
    body: event.body
  });

  try {
    switch (path) {
      case '/auth/login':
        return await handleLogin(event, headers);
      
      case '/auth/logout':
        return await handleLogout(event, headers);
      
      case '/auth/check':
        return await handleAuthCheck(event, headers);
      
      case '/health':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
          }),
        };
      
      case '/dashboard':
        return await handleDashboard(event, headers);
      
      case '/settings':
        return await handleSettings(event, headers);
      
      case '/expense-types':
        return await handleExpenseTypes(event, headers);
      
      case '/employees':
        return await handleEmployees(event, headers);
      
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Not found',
            path: path,
            available_endpoints: ['/auth/login', '/auth/logout', '/auth/check', '/health', '/dashboard', '/settings', '/expense-types', '/employees']
          }),
        };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

async function handleLogin(event, headers) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'اسم المستخدم وكلمة المرور مطلوبان' }),
      };
    }

    // Check demo users
    const user = demoUsers.find(u => u.username === username && u.password === password);

    if (user) {
      // Remove password from response
      const { password: _, ...userResponse } = user;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(userResponse),
      };
    }

    // If no demo user found, check if we should try database connection
    // For now, return authentication error
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ 
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        hint: 'للتجربة استخدم: admin/admin123 أو manager/manager123'
      }),
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
    };
  }
}

async function handleLogout(event, headers) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'تم تسجيل الخروج بنجاح' }),
  };
}

async function handleAuthCheck(event, headers) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // For demo purposes, always return not authenticated
  // In a real implementation, you would check session/token
  return {
    statusCode: 401,
    headers,
    body: JSON.stringify({ error: 'Not authenticated' }),
  };
}

async function handleDashboard(event, headers) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Mock dashboard data
  const dashboardData = {
    totalProjects: 5,
    activeProjects: 3,
    totalEmployees: 12,
    totalTransactions: 45,
    totalRevenue: 150000,
    totalExpenses: 80000,
    stats: {
      projectsThisMonth: 2,
      employeesActive: 10,
      transactionsThisMonth: 15
    }
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(dashboardData),
  };
}

async function handleSettings(event, headers) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Mock settings data
  const settingsData = {
    companyName: 'شركة التطوير المتقدم',
    currency: 'USD',
    language: 'ar',
    theme: 'light',
    notifications: {
      email: true,
      sms: false,
      whatsapp: true
    },
    features: {
      whatsappIntegration: true,
      fileSync: true,
      advancedReports: false
    }
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(settingsData),
  };
}

async function handleExpenseTypes(event, headers) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Mock expense types data
  const expenseTypes = [
    { id: 1, name: 'مصاريف النقل', description: 'تكاليف النقل والمواصلات', active: true },
    { id: 2, name: 'مصاريف المكتب', description: 'أدوات ومستلزمات المكتب', active: true },
    { id: 3, name: 'مصاريف التسويق', description: 'الإعلانات والدعاية', active: true },
    { id: 4, name: 'رواتب الموظفين', description: 'رواتب وأجور العمالة', active: true },
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(expenseTypes),
  };
}

async function handleEmployees(event, headers) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Mock employees data
  const employees = [
    { id: 1, name: 'أحمد محمد', position: 'مطور واجهات', salary: 5000, active: true, assigned_project_id: 1 },
    { id: 2, name: 'فاطمة علي', position: 'مطورة خلفية', salary: 4500, active: true, assigned_project_id: 1 },
    { id: 3, name: 'محمد صالح', position: 'مدير مشروع', salary: 6000, active: true, assigned_project_id: 2 },
    { id: 4, name: 'نور الهدى', position: 'مصممة UI/UX', salary: 4000, active: true, assigned_project_id: 1 },
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(employees),
  };
}

export { handler };
