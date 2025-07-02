// Netlify Edge Function
export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');
  
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Handle OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response('', { headers });
  }

  // Simple login test
  if (path === '/auth/login' && request.method === 'POST') {
    try {
      const body = await request.json();
      console.log('Login attempt:', body);
      
      if (body.username === 'admin' && body.password === 'admin123') {
        return new Response(JSON.stringify({
          id: 1,
          username: 'admin',
          name: 'مدير النظام',
          email: 'admin@example.com',
          role: 'admin',
          permissions: [
            'view_dashboard', 'manage_users', 'view_users', 'manage_projects',
            'view_projects', 'manage_project_transactions', 'view_project_transactions',
            'manage_transactions', 'view_transactions', 'manage_documents',
            'view_documents', 'view_reports', 'view_activity_logs', 'manage_settings'
          ],
          active: true
        }), { 
          status: 200,
          headers: {
            ...headers,
            'Set-Cookie': 'connect.sid=test123; HttpOnly; Max-Age=86400; Path=/; SameSite=Lax'
          }
        });
      }
      
      return new Response(JSON.stringify({ 
        message: "اسم المستخدم أو كلمة المرور غير صحيح" 
      }), { status: 401, headers });
    } catch (error) {
      return new Response(JSON.stringify({ 
        message: "خطأ في معالجة الطلب" 
      }), { status: 500, headers });
    }
  }

  // Session check
  if (path === '/auth/session' && request.method === 'GET') {
    const cookie = request.headers.get('cookie');
    if (cookie && cookie.includes('connect.sid=test123')) {
      return new Response(JSON.stringify({
        id: 1,
        username: 'admin',
        name: 'مدير النظام',
        role: 'admin',
        permissions: [
          'view_dashboard', 'manage_users', 'view_users', 'manage_projects',
          'view_projects', 'manage_project_transactions', 'view_project_transactions',
          'manage_transactions', 'view_transactions', 'manage_documents',
          'view_documents', 'view_reports', 'view_activity_logs', 'manage_settings'
        ]
      }), { status: 200, headers });
    }
    
    return new Response(JSON.stringify({ 
      message: "غير مصرح" 
    }), { status: 401, headers });
  }

  // Default response
  return new Response(JSON.stringify({ 
    message: 'API endpoint not found',
    path: path,
    method: request.method
  }), { status: 404, headers });
};

export const config = {
  path: "/api/*"
};