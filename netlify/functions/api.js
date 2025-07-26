import { createClient } from '@supabase/supabase-js'

// إعداد Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

let supabase = null
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
}

// Netlify Functions API handler (JavaScript version)
const handler = async (event, context) => {
  // Handle CORS with proper headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json; charset=utf-8',
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
      
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Not found',
            path: path,
            available_endpoints: ['/auth/login', '/auth/logout', '/auth/check', '/health']
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

    console.log('Login attempt:', { username, password: '***' }); // Log for debugging

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
      
      console.log('User found:', userResponse); // Log successful login
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(userResponse),
      };
    }

    console.log('Invalid credentials for user:', username); // Log failed login
    
    // If no demo user found, return authentication error
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ 
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        message: 'للتجربة استخدم: admin/admin123 أو manager/manager123 أو user/user123'
      }),
    };

  } catch (error) {
    console.error('Login parsing error:', error);
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

export { handler };
