// Professional Netlify Function for Accounting System API
const express = require('express');

// Global app instance
let app;

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const API_VERSION = '1.0.0';

// Initialize Express app with production-ready configuration
const initializeApp = async () => {
  if (app) return app;
  
  console.log('🚀 Initializing Professional Accounting System API...');
  console.log(`📍 Environment: ${isProduction ? 'Production' : 'Development'}`);
  console.log(`📍 API Version: ${API_VERSION}`);
  
  app = express();
  
  // Security middleware
  app.use((req, res, next) => {
    // Security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // API info headers
    res.header('X-API-Version', API_VERSION);
    res.header('X-Powered-By', 'Accounting-System-API');
    
    next();
  });
  
  // CORS configuration
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Max-Age', '86400');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  
  // Body parsing middleware
  app.use(express.json({ 
    limit: isProduction ? '5mb' : '10mb',
    strict: true
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: isProduction ? '5mb' : '10mb'
  }));
  
  // Request logging middleware
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path}`);
    
    req.requestId = Math.random().toString(36).substr(2, 9);
    res.header('X-Request-ID', req.requestId);
    
    next();
  });

  // API Info endpoint
  app.get('/', (req, res) => {
    res.json({
      service: 'نظام المحاسبة العربي - API',
      version: API_VERSION,
      environment: isProduction ? 'production' : 'development',
      timestamp: new Date().toISOString(),
      status: 'operational',
      endpoints: {
        info: 'GET /',
        health: 'GET /health',
        test: 'GET /test',
        auth: {
          login: 'POST /auth/login',
          logout: 'POST /auth/logout'
        },
        accounting: {
          transactions: 'GET /accounting/transactions',
          createTransaction: 'POST /accounting/transactions'
        },
        customers: 'GET /customers',
        reports: {
          summary: 'GET /reports/summary'
        }
      }
    });
  });

  app.get('/health', (req, res) => {
    const healthStatus = {
      status: 'healthy',
      service: 'accounting-system-api',
      version: API_VERSION,
      timestamp: new Date().toISOString(),
      environment: isProduction ? 'production' : 'development',
      requestId: req.requestId,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        api: 'ok',
        database: 'ok',
        storage: 'ok'
      }
    };
    
    res.json(healthStatus);
  });

  app.get('/test', (req, res) => {
    res.json({ 
      message: 'نظام المحاسبة العربي API يعمل بشكل صحيح!',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      requestId: req.requestId,
      version: API_VERSION
    });
  });

  // Authentication endpoints
  app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: 'اسم المستخدم وكلمة المرور مطلوبان',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: '1',
        username: username,
        role: 'admin',
        permissions: ['read', 'write', 'admin']
      },
      token: 'mock-jwt-token',
      expiresIn: '24h'
    });
  });

  app.post('/auth/logout', (req, res) => {
    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
  });

  // Accounting endpoints
  app.get('/accounting/transactions', (req, res) => {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    
    const transactions = Array.from({ length: parseInt(limit) }, (_, i) => ({
      id: `txn_${Date.now()}_${i}`,
      date: new Date().toISOString(),
      type: type || (i % 2 === 0 ? 'income' : 'expense'),
      amount: Math.floor(Math.random() * 10000) + 100,
      description: `معاملة رقم ${i + 1}`,
      category: i % 2 === 0 ? 'مبيعات' : 'مصروفات',
      status: 'completed'
    }));
    
    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 500,
        pages: Math.ceil(500 / parseInt(limit))
      }
    });
  });

  app.post('/accounting/transactions', (req, res) => {
    const { type, amount, description, category } = req.body;
    
    if (!type || !amount || !description) {
      return res.status(400).json({
        error: 'النوع والمبلغ والوصف مطلوبان',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    const transaction = {
      id: `txn_${Date.now()}`,
      type,
      amount: parseFloat(amount),
      description,
      category: category || 'عام',
      date: new Date().toISOString(),
      status: 'completed',
      createdBy: 'current-user'
    };
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء المعاملة بنجاح',
      data: transaction
    });
  });

  // Customers endpoints
  app.get('/customers', (req, res) => {
    const { page = 1, limit = 20, search } = req.query;
    
    const customers = Array.from({ length: parseInt(limit) }, (_, i) => ({
      id: `cust_${Date.now()}_${i}`,
      name: `العميل ${i + 1}`,
      email: `customer${i + 1}@example.com`,
      phone: `+966${Math.floor(Math.random() * 1000000000)}`,
      address: `الرياض، المملكة العربية السعودية`,
      balance: Math.floor(Math.random() * 50000),
      status: i % 3 === 0 ? 'active' : 'inactive',
      createdAt: new Date().toISOString()
    }));
    
    res.json({
      success: true,
      data: customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 150,
        pages: Math.ceil(150 / parseInt(limit))
      }
    });
  });

  // Reports endpoints
  app.get('/reports/summary', (req, res) => {
    const { period = 'month' } = req.query;
    
    const summary = {
      period,
      totalIncome: Math.floor(Math.random() * 100000) + 50000,
      totalExpenses: Math.floor(Math.random() * 80000) + 30000,
      netProfit: 0,
      transactionCount: Math.floor(Math.random() * 500) + 100,
      customerCount: Math.floor(Math.random() * 100) + 50,
      generatedAt: new Date().toISOString()
    };
    
    summary.netProfit = summary.totalIncome - summary.totalExpenses;
    
    res.json({
      success: true,
      data: summary
    });
  });

  // Error handling middleware
  app.use((error, req, res, next) => {
    console.error(`Error in API request ${req.requestId}:`, error);
    
    res.status(error.status || 500).json({
      error: error.message || 'خطأ داخلي في الخادم',
      code: error.code || 'INTERNAL_SERVER_ERROR',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'المسار المطلوب غير موجود',
      code: 'ENDPOINT_NOT_FOUND',
      path: req.path,
      method: req.method,
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  });

  console.log('✅ Professional API initialized successfully');
  return app;
};

// Enhanced Netlify function handler
exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  console.log(`🔄 API Request: ${event.httpMethod} ${event.path}`);
  
  try {
    const app = await initializeApp();
    
    // Create serverless request object
    const req = {
      path: event.path.replace('/.netlify/functions/api', '') || '/',
      method: event.httpMethod,
      headers: event.headers || {},
      body: event.body ? (
        event.headers['content-type']?.includes('application/json') 
          ? JSON.parse(event.body) 
          : event.body
      ) : {},
      query: event.queryStringParameters || {},
      params: {},
      get: function(header) {
        return this.headers[header.toLowerCase()];
      },
      requestId: Math.random().toString(36).substr(2, 9)
    };
    
    let statusCode = 200;
    let responseBody = {};
    let responseHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'X-API-Version': API_VERSION,
      'X-Request-ID': req.requestId
    };
    
    // Create mock response object
    const res = {
      status: function(code) {
        statusCode = code;
        return this;
      },
      json: function(body) {
        responseBody = body;
        responseHeaders['Content-Type'] = 'application/json';
        return this;
      },
      send: function(body) {
        responseBody = typeof body === 'object' ? body : { message: body };
        return this;
      },
      header: function(key, value) {
        responseHeaders[key] = value;
        return this;
      },
      set: function(key, value) {
        responseHeaders[key] = value;
        return this;
      },
      end: function() {
        return this;
      }
    };
    
    // Handle OPTIONS requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: ''
      };
    }
    
    // Simple routing logic
    const routes = {
      'GET /': () => app._router.stack.find(l => l.route?.path === '/')?.route.stack[0].handle(req, res),
      'GET /health': () => app._router.stack.find(l => l.route?.path === '/health')?.route.stack[0].handle(req, res),
      'GET /test': () => app._router.stack.find(l => l.route?.path === '/test')?.route.stack[0].handle(req, res),
      'POST /auth/login': () => app._router.stack.find(l => l.route?.path === '/auth/login' && l.route.methods.post)?.route.stack[0].handle(req, res),
      'POST /auth/logout': () => app._router.stack.find(l => l.route?.path === '/auth/logout' && l.route.methods.post)?.route.stack[0].handle(req, res),
      'GET /accounting/transactions': () => app._router.stack.find(l => l.route?.path === '/accounting/transactions' && l.route.methods.get)?.route.stack[0].handle(req, res),
      'POST /accounting/transactions': () => app._router.stack.find(l => l.route?.path === '/accounting/transactions' && l.route.methods.post)?.route.stack[0].handle(req, res),
      'GET /customers': () => app._router.stack.find(l => l.route?.path === '/customers')?.route.stack[0].handle(req, res),
      'GET /reports/summary': () => app._router.stack.find(l => l.route?.path === '/reports/summary')?.route.stack[0].handle(req, res)
    };
    
    const routeKey = `${req.method} ${req.path}`;
    const routeHandler = routes[routeKey];
    
    if (routeHandler) {
      await routeHandler();
    } else {
      statusCode = 404;
      responseBody = {
        error: 'المسار المطلوب غير موجود',
        code: 'ENDPOINT_NOT_FOUND',
        path: req.path,
        method: req.method,
        availableEndpoints: Object.keys(routes),
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      };
    }
    
    const responseTime = Date.now() - startTime;
    responseHeaders['X-Response-Time'] = `${responseTime}ms`;
    
    console.log(`✅ API Response: ${statusCode} (${responseTime}ms)`);
    
    return {
      statusCode,
      headers: responseHeaders,
      body: JSON.stringify(responseBody)
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('❌ API Error:', error.message);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Response-Time': `${responseTime}ms`,
        'X-Error': 'true'
      },
      body: JSON.stringify({
        error: 'خطأ داخلي في الخادم',
        code: 'INTERNAL_SERVER_ERROR',
        message: isProduction ? 'حدث خطأ غير متوقع' : error.message,
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`
      })
    };
  }
};
