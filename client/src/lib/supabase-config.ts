// Supabase configuration for Arabic Accounting System
export const supabaseConfig = {
  // Supabase URL and anon key
  url: process.env.VITE_SUPABASE_URL || 'https://yieyqusnciiithjtlgod.supabase.co',
  anonKey: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXlxdXNuY2lpaXRoamRsZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwNjE5NDQsImV4cCI6MjA1MTYzNzk0NH0.PWwLKV-TaFAA2ZpOKHGjJp3yEhUH4B3FJMzDL7gB1Rk',
  
  // Database configuration
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const
  },
  
  // Real-time subscriptions
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  
  // Storage configuration
  storage: {
    bucketName: 'documents',
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    maxFileSize: 10 * 1024 * 1024 // 10MB
  }
};

// Environment-specific configurations
export const getSupabaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return {
        ...supabaseConfig,
        url: process.env.VITE_SUPABASE_URL,
        anonKey: process.env.VITE_SUPABASE_ANON_KEY,
      };
    case 'staging':
      return {
        ...supabaseConfig,
        url: process.env.VITE_SUPABASE_STAGING_URL,
        anonKey: process.env.VITE_SUPABASE_STAGING_ANON_KEY,
      };
    default:
      return {
        ...supabaseConfig,
        url: process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        anonKey: process.env.VITE_SUPABASE_ANON_KEY || 'local-anon-key',
      };
  }
};

export default supabaseConfig;
