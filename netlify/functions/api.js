// Simple & Reliable Netlify Function for Accounting System
exports.handler = async (event, context) => {
  console.log(`API Request: ${event.httpMethod} ${event.path}`);
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };
  
  try {
    const path = event.path.replace('/.netlify/functions/api', '') || '/';
    const method = event.httpMethod;
    
    // Simple routing
    if (path === '/' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'نظام المحاسبة العربي API',
          version: '1.0.0',
          status: 'active',
          timestamp: new Date().toISOString()
        })
      };
    }
    
    if (path === '/health' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'healthy',
          service: 'accounting-api',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'production'
        })
      };
    }
    
    if (path === '/test' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'اختبار API - يعمل بشكل صحيح!',
          path: path,
          method: method,
          timestamp: new Date().toISOString()
        })
      };
    }
    
    // Mock auth endpoints
    if (path === '/auth/login' && method === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'تم تسجيل الدخول بنجاح',
          user: {
            id: '1',
            username: body.username || 'admin',
            role: 'admin'
          },
          token: 'mock-jwt-token'
        })
      };
    }
    
    // Mock transactions endpoint
    if (path === '/accounting/transactions' && method === 'GET') {
      const mockTransactions = Array.from({ length: 10 }, (_, i) => ({
        id: `txn_${i + 1}`,
        date: new Date().toISOString(),
        type: i % 2 === 0 ? 'income' : 'expense',
        amount: Math.floor(Math.random() * 5000) + 100,
        description: `معاملة رقم ${i + 1}`,
        category: i % 2 === 0 ? 'مبيعات' : 'مصروفات'
      }));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: mockTransactions,
          total: mockTransactions.length
        })
      };
    }
    
    // Mock customers endpoint
    if (path === '/customers' && method === 'GET') {
      const mockCustomers = Array.from({ length: 5 }, (_, i) => ({
        id: `cust_${i + 1}`,
        name: `العميل ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        phone: `+966${Math.floor(Math.random() * 1000000000)}`,
        balance: Math.floor(Math.random() * 10000)
      }));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: mockCustomers,
          total: mockCustomers.length
        })
      };
    }
    
    // 404 for unknown endpoints
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'المسار غير موجود',
        path: path,
        method: method,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'خطأ في الخادم',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
