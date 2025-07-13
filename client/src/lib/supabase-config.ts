// Supabase configuration for Arabic Accounting System
export const supabaseConfig = {
  // Supabase URL and anon key - قيم افتراضية للتشغيل
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
  
  // التأكد من أن القيم الافتراضية متوفرة دائماً
  const defaultUrl = 'https://jcoekbaahgjympmnuilr.supabase.co';
  const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjb2VrYmFhaGdqeW1wbW51aWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNTA1MDcsImV4cCI6MjA2NzYyNjUwN30.CGwebOhh_c4buoX_Uh111zzo8H3p4Ak_p3v3V0LcjRA';
  
  switch (env) {
    case 'production':
      return {
        ...supabaseConfig,
        url: process.env.VITE_SUPABASE_URL || defaultUrl,
        anonKey: process.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey,
      };
    case 'staging':
      return {
        ...supabaseConfig,
        url: process.env.VITE_SUPABASE_STAGING_URL || defaultUrl,
        anonKey: process.env.VITE_SUPABASE_STAGING_ANON_KEY || defaultAnonKey,
      };
    default:
      return {
        ...supabaseConfig,
        url: process.env.VITE_SUPABASE_URL || defaultUrl,
        anonKey: process.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey,
      };
  }
};

export default supabaseConfig;
