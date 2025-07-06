const express = require('express');

let app;

const initializeApp = async () => {
  if (app) return app;
  
  console.log('🚀 Initializing Express app for Netlify...');
  
  app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Add CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });

  // Basic test routes
  app.get('/test', (req, res) => {
    res.json({ 
      message: 'API is working!', 
      timestamp: new Date().toISOString(),
      environment: 'netlify-functions',
      path: req.path
    });
  });

  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      service: 'accounting-system-api',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/', (req, res) => {
    res.json({ 
      message: 'Accounting System API',
      version: '1.0.0',
      endpoints: ['/test', '/health'],
      timestamp: new Date().toISOString()
    });
  });

  console.log('✅ Express app initialized for Netlify');
  return app;
};

// Main Netlify serverless function handler
exports.handler = async (event, context) => {
  console.log('📥 API Request:', {
    method: event.httpMethod,
    path: event.path,
    query: event.queryStringParameters
  });

  try {
    const app = await initializeApp();
    
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

    // Create Express-compatible request and response objects
    return new Promise((resolve) => {
      // Extract API path (remove /api prefix from the path)
      const apiPath = event.path.replace(/^\/\.netlify\/functions\/api/, '') || '/';
      
      const req = {
        method: event.httpMethod,
        url: apiPath,
        path: apiPath,
        originalUrl: event.path,
        headers: event.headers || {},
        query: event.queryStringParameters || {},
        body: event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body) : null,
        params: {}
      };

      // Parse JSON body if content-type is application/json
      if (req.body && event.headers['content-type'] && event.headers['content-type'].includes('application/json')) {
        try {
          req.body = JSON.parse(req.body);
        } catch (e) {
          // Keep as string if JSON parsing fails
        }
      }

      let statusCode = 200;
      let headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      };
      let responseBody = '';
      let finished = false;

      const res = {
        status: function(code) {
          statusCode = code;
          return this;
        },
        json: function(data) {
          if (!finished) {
            finished = true;
            responseBody = JSON.stringify(data);
            resolve({
              statusCode,
              headers,
              body: responseBody
            });
          }
          return this;
        },
        send: function(data) {
          if (!finished) {
            finished = true;
            responseBody = typeof data === 'string' ? data : JSON.stringify(data);
            resolve({
              statusCode,
              headers,
              body: responseBody
            });
          }
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
          if (!finished) {
            finished = true;
            if (data) responseBody = typeof data === 'string' ? data : JSON.stringify(data);
            resolve({
              statusCode,
              headers,
              body: responseBody
            });
          }
          return this;
        }
      };

      // Try to find and execute matching route
      try {
        // Get all routes from the Express app
        const routes = app._router?.stack || [];
        let routeFound = false;

        for (const layer of routes) {
          if (layer.route) {
            const route = layer.route;
            const methods = Object.keys(route.methods);
            
            // Check if method matches
            if (methods.includes(req.method.toLowerCase())) {
              // Check if path matches
              if (route.path === req.path || (route.path === '/' && req.path === '')) {
                routeFound = true;
                try {
                  // Execute the route handler
                  const handler = route.stack[0].handle;
                  handler(req, res, () => {});
                  break;
                } catch (err) {
                  console.error('Route handler error:', err);
                  if (!finished) {
                    finished = true;
                    resolve({
                      statusCode: 500,
                      headers,
                      body: JSON.stringify({ error: 'Route handler error', message: err.message })
                    });
                  }
                  break;
                }
              }
            }
          }
        }

        // If no route found, return 404
        if (!routeFound && !finished) {
          finished = true;
          resolve({
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Route not found',
              path: req.path,
              method: req.method,
              availableRoutes: routes.filter(l => l.route).map(l => ({ path: l.route.path, methods: Object.keys(l.route.methods) }))
            })
          });
        }

      } catch (error) {
        console.error('Request processing error:', error);
        if (!finished) {
          finished = true;
          resolve({
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
          });
        }
      }

      // Timeout fallback
      setTimeout(() => {
        if (!finished) {
          finished = true;
          resolve({
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Request timeout' })
          });
        }
      }, 8000);
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

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Endpoint not found',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });

  console.log('✅ Express app initialized for Netlify');
  return app;
};

// Netlify function handler
exports.handler = async (event, context) => {
  console.log('📥 API Request:', {
    method: event.httpMethod,
    path: event.path,
    query: event.queryStringParameters
  });

  try {
    const app = await initializeApp();
    
    return new Promise((resolve) => {
      const apiPath = event.path.replace(/^\/\.netlify\/functions\/api/, '') || '/';
      
      const req = {
        method: event.httpMethod,
        url: apiPath,
        path: apiPath,
        originalUrl: event.path,
        headers: event.headers || {},
        query: event.queryStringParameters || {},
        body: event.body ? JSON.parse(event.body) : {}
      };

      let statusCode = 200;
      let headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      };
      let responseBody = '';
      let finished = false;

      const res = {
        status: function(code) {
          statusCode = code;
          return this;
        },
        json: function(data) {
          if (!finished) {
            responseBody = JSON.stringify(data);
            finished = true;
            resolve({ statusCode, headers, body: responseBody });
          }
          return this;
        },
        header: function(name, value) {
          headers[name] = value;
          return this;
        },
        end: function(data) {
          if (!finished) {
            if (data) responseBody = data;
            finished = true;
            resolve({ statusCode, headers, body: responseBody });
          }
          return this;
        }
      };

      // Handle CORS preflight
      if (event.httpMethod === 'OPTIONS') {
        return resolve({ statusCode: 200, headers, body: '' });
      }

      // Simple routing
      try {
        if (req.path === '/' || req.path === '') {
          app._router.stack[2].route.stack[0].handle(req, res);
        } else if (req.path === '/test') {
          app._router.stack[0].route.stack[0].handle(req, res);
        } else if (req.path === '/health') {
          app._router.stack[1].route.stack[0].handle(req, res);
        } else {
          res.status(404).json({
            error: 'Route not found',
            path: req.path,
            method: req.method
          });
        }
      } catch (error) {
        console.error('Routing error:', error);
        if (!finished) {
          finished = true;
          resolve({
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
          });
        }
      }

      // Timeout fallback
      setTimeout(() => {
        if (!finished) {
          finished = true;
          resolve({
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Request timeout' })
          });
        }
      }, 10000);
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
