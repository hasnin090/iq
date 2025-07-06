// Netlify function handler for API routes
const express = require('express');

// Global app instance
let app;

// Initialize Express app with basic routes
const initializeApp = async () => {
  if (app) return app;
  
  console.log('🚀 Initializing Express app for Netlify...');
  
  app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });

  // Health check routes
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      service: 'accounting-system-api',
      timestamp: new Date().toISOString(),
      environment: 'netlify-functions'
    });
  });

  app.get('/test', (req, res) => {
    res.json({ 
      message: 'API is working!', 
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  });

  return app;
};

// Netlify function handler
exports.handler = async (event, context) => {
  try {
    // Initialize the app
    const app = await initializeApp();
    
    // Parse path and method
    const path = event.path.replace('/.netlify/functions/api', '') || '/';
    const method = event.httpMethod;
    
    console.log(`📨 API Request: ${method} ${path}`);
    
    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    };
    
    // Handle OPTIONS requests
    if (method === 'OPTIONS') {
      return {
        statusCode: 204,
        headers,
        body: ''
      };
    }
    
    // Create mock Express request object
    const req = {
      path,
      method,
      headers: event.headers,
      query: event.queryStringParameters || {},
      body: event.body ? JSON.parse(event.body) : {},
      params: {},
      ip: event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown'
    };
    
    // Create mock Express response object
    let statusCode = 200;
    let responseBody = {};
    let responseHeaders = { ...headers };
    
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (body) => {
        responseBody = body;
        return res;
      },
      send: (body) => {
        responseBody = body;
        return res;
      },
      header: (key, value) => {
        responseHeaders[key] = value;
        return res;
      },
      set: (key, value) => {
        responseHeaders[key] = value;
        return res;
      }
    };
    
    // Process the request through express router
    return new Promise((resolve) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.error('⚠️ Request timeout exceeded');
        resolve({
          statusCode: 504,
          headers,
          body: JSON.stringify({ error: 'Gateway timeout' })
        });
      }, 25000); // 25 second timeout
      
      // Handle the request
      app._router.handle(req, res, () => {
        clearTimeout(timeout);
        resolve({
          statusCode,
          headers: responseHeaders,
          body: typeof responseBody === 'string' 
            ? responseBody 
            : JSON.stringify(responseBody)
        });
      });
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
        error: 'Server error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Export the handler function directly
// Not needed as exports.handler is already defined
