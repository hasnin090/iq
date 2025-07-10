// Supabase configuration for Arabic Accounting System
export const supabaseConfig = {
  // Supabase URL and anon key - مُحدث مع المفاتيح الصحيحة
  url: process.env.VITE_SUPABASE_URL || 'https://jcoekbaahgjympmnuilr.supabase.co',
  anonKey: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjb2VrYmFhaGdqeW1wbW51aWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNTA1MDcsImV4cCI6MjA2NzYyNjUwN30.CGwebOhh_c4buoX_Uh111zzo8H3p4Ak_p3v3V0LcjRA',
  
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
