// Professional Netlify Function for Accounting System API
const express = require('express');
const cors = require('cors');

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
  
  // CORS configuration for production
  const corsOptions = {
    origin: isProduction 
      ? ['https://your-domain.netlify.app', 'https://your-custom-domain.com'] 
      : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400 // 24 hours
  };
  
  app.use(cors(corsOptions));
  
  // Body parsing middleware with security limits
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
    
    // Add request tracking
    req.requestId = Math.random().toString(36).substr(2, 9);
    res.header('X-Request-ID', req.requestId);
    
    next();
  });

  // API Info and Health endpoints
  app.get('/info', (req, res) => {
    res.json({
      service: 'نظام المحاسبة العربي - API',
      version: API_VERSION,
      environment: isProduction ? 'production' : 'development',
      timestamp: new Date().toISOString(),
      status: 'operational',
      features: {
        accounting: 'enabled',
        invoices: 'enabled',
        customers: 'enabled',
        reports: 'enabled',
        authentication: 'enabled'
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
        database: 'ok', // This should be replaced with actual DB health check
        storage: 'ok'   // This should be replaced with actual storage health check
      }
    };
    
    res.json(healthStatus);
  });

  // Test endpoint for API validation
  app.get('/test', (req, res) => {
    res.json({ 
      message: 'نظام المحاسبة العربي API يعمل بشكل صحيح!',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      requestId: req.requestId,
      userAgent: req.get('User-Agent'),
      version: API_VERSION
    });
  });

  // Authentication endpoints
  app.post('/auth/login', (req, res) => {
    // TODO: Implement actual authentication logic
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: 'اسم المستخدم وكلمة المرور مطلوبان',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // Mock response for now
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
    
    // Mock data for now
    const transactions = Array.from({ length: limit }, (_, i) => ({
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
        total: 500, // Mock total
        pages: Math.ceil(500 / limit)
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
    
    // Mock creation
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
    
    // Mock customer data
    const customers = Array.from({ length: limit }, (_, i) => ({
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
        total: 150, // Mock total
        pages: Math.ceil(150 / limit)
      }
    });
  });

  // Reports endpoints
  app.get('/reports/summary', (req, res) => {
    const { period = 'month' } = req.query;
    
    // Mock summary data
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
  try {
    // Import the createServer function from our TypeScript server
    const { createServer } = await import('../../server/index.js');
    if (createServer) {
      console.log('📝 Loading server routes...');
      const { app: serverApp } = await createServer();
      
      // Copy routes from server app to our Netlify app
      if (serverApp && serverApp._router) {
        serverApp._router.stack.forEach(layer => {
          if (layer.route) {
            const path = layer.route.path;
            const methods = Object.keys(layer.route.methods);
            
            methods.forEach(method => {
              if (app[method]) {
                app[method](path, ...layer.route.stack.map(l => l.handle));
              }
            });
          }
        });
        console.log('✅ Server routes loaded successfully');
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not load server routes:', error.message);
    
    // Fallback routes
    app.get('/', (req, res) => {
      res.json({ 
        message: 'نظام المحاسبة العربي - API',
        version: '1.0.0',
        status: 'running'
      });
    });
    
    app.get('/api', (req, res) => {
      res.json({ 
        message: 'نظام المحاسبة العربي - API',
        version: '1.0.0',
        endpoints: ['/health', '/test', '/api']
      });
    });
  }

  // Default 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Endpoint not found',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      availableEndpoints: ['/health', '/test', '/api']
    });
  });

  console.log('✅ Express app initialized for Netlify Functions');
  return app;
};

// Main Netlify handler
exports.handler = async (event, context) => {
  console.log('📥 Netlify Function Request:', {
    method: event.httpMethod,
    path: event.path,
    query: event.queryStringParameters
  });

  try {
    const app = await initializeApp();
    
    return new Promise((resolve) => {
      // Extract API path
      let apiPath = event.path;
      
      // Remove /.netlify/functions/api prefix
      if (apiPath.startsWith('/.netlify/functions/api')) {
        apiPath = apiPath.replace('/.netlify/functions/api', '') || '/';
      }
      
      console.log('🎯 Routing to:', apiPath);

      // Create Express-compatible request object
      const req = {
        method: event.httpMethod,
        url: apiPath,
        path: apiPath,
        originalUrl: event.path,
        headers: event.headers || {},
        query: event.queryStringParameters || {},
        body: event.body,
        params: {}
      };

      // Parse JSON body if needed
      if (req.body && req.headers['content-type']?.includes('application/json')) {
        try {
          req.body = JSON.parse(req.body);
        } catch (e) {
          console.warn('Failed to parse JSON body:', e);
        }
      }

      // Response state
      let statusCode = 200;
      let headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      };
      let responseBody = '';
      let responseSent = false;

      // Create Express-compatible response object
      const res = {
        status: function(code) {
          statusCode = code;
          return this;
        },
        json: function(data) {
          if (responseSent) return this;
          responseBody = JSON.stringify(data);
          this.end();
          return this;
        },
        send: function(data) {
          if (responseSent) return this;
          responseBody = typeof data === 'string' ? data : JSON.stringify(data);
          this.end();
          return this;
        },
        header: function(name, value) {
          headers[name] = value;
          return this;
        },
        setHeader: function(name, value) {
          headers[name] = value;
          return this;
        },
        end: function(data) {
          if (responseSent) return;
          responseSent = true;
          
          if (data) {
            responseBody = typeof data === 'string' ? data : JSON.stringify(data);
          }
          
          resolve({
            statusCode,
            headers,
            body: responseBody
          });
        }
      };

      // Handle CORS preflight
      if (event.httpMethod === 'OPTIONS') {
        return resolve({
          statusCode: 200,
          headers,
          body: ''
        });
      }

      // Set timeout
      const timeout = setTimeout(() => {
        if (!responseSent) {
          resolve({
            statusCode: 504,
            headers,
            body: JSON.stringify({ error: 'Request timeout' })
          });
        }
      }, 25000);

      try {
        // Find and execute route
        let routeFound = false;
        
        if (app._router && app._router.stack) {
          for (const layer of app._router.stack) {
            if (layer.route) {
              const route = layer.route;
              const routePath = route.path;
              const methods = Object.keys(route.methods);
              
              if (methods.includes(req.method.toLowerCase())) {
                if (routePath === apiPath || routePath === '/' || routePath === '*') {
                  routeFound = true;
                  console.log('✅ Route found:', routePath);
                  
                  try {
                    const handler = route.stack[0].handle;
                    handler(req, res, () => {});
                    clearTimeout(timeout);
                  } catch (handlerError) {
                    console.error('Route handler error:', handlerError);
                    clearTimeout(timeout);
                    if (!responseSent) {
                      resolve({
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({ error: 'Internal server error' })
                      });
                    }
                  }
                  break;
                }
              }
            }
          }
        }

        if (!routeFound) {
          console.log('❌ No route found for:', apiPath);
          clearTimeout(timeout);
          resolve({
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Route not found',
              path: apiPath,
              method: req.method
            })
          });
        }

      } catch (error) {
        console.error('Request processing error:', error);
        clearTimeout(timeout);
        resolve({
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Internal server error' })
        });
      }
    });

  } catch (error) {
    console.error('❌ Netlify function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Server initialization failed',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
