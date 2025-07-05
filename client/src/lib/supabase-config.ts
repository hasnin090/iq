// Supabase configuration for Arabic Accounting System
export const supabaseConfig = {
  // Replace with your actual Supabase URL and anon key
  url: process.env.VITE_SUPABASE_URL || 'https://your-project-ref.supabase.co',
  anonKey: process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here',
  
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
