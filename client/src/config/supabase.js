// 🔧 إعدادات Supabase للعميل
// ===============================

import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jcoekbaahgjympmnuilr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjb2VrYmFhaGdqeW1wbW51aWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNTA1MDcsImV4cCI6MjA2NzYyNjUwN30.CGwebOhh_c4buoX_Uh111zzo8H3p4Ak_p3v3V0LcjRA';

// إنشاء عميل Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'arabic-accounting-system'
    }
  }
});

// حسابات تجريبية للاختبار
export const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    name: 'المدير العام'
  },
  manager: {
    email: 'manager@example.com',
    password: 'manager123',
    role: 'manager',
    name: 'مدير المشاريع'
  },
  user: {
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
    name: 'مستخدم عادي'
  }
};

// دوال مساعدة للمصادقة
export const authHelpers = {
  // تسجيل دخول سريع بحساب تجريبي
  async loginAsAdmin() {
    return await supabase.auth.signInWithPassword({
      email: TEST_ACCOUNTS.admin.email,
      password: TEST_ACCOUNTS.admin.password
    });
  },

  async loginAsManager() {
    return await supabase.auth.signInWithPassword({
      email: TEST_ACCOUNTS.manager.email,
      password: TEST_ACCOUNTS.manager.password
    });
  },

  async loginAsUser() {
    return await supabase.auth.signInWithPassword({
      email: TEST_ACCOUNTS.user.email,
      password: TEST_ACCOUNTS.user.password
    });
  },

  // تسجيل الخروج
  async logout() {
    return await supabase.auth.signOut();
  },

  // الحصول على المستخدم الحالي
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // الحصول على ملف المستخدم
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('خطأ في جلب ملف المستخدم:', error);
      return null;
    }
    
    return data;
  }
};

// إعدادات قاعدة البيانات
export const dbConfig = {
  supabaseUrl,
  supabaseAnonKey,
  tables: {
    users: 'profiles',
    projects: 'projects',
    transactions: 'transactions',
    employees: 'employees',
    documents: 'documents',
    receivables: 'receivables',
    userRoles: 'user_roles'
  }
};

// دوال API
export const api = {
  // الحصول على الإحصائيات
  async getDashboardStats() {
    try {
      const response = await fetch('/api/dashboard');
      return await response.json();
    } catch (error) {
      console.error('خطأ في جلب إحصائيات لوحة التحكم:', error);
      return null;
    }
  },

  // الحصول على أنواع المصروفات
  async getExpenseTypes() {
    try {
      const response = await fetch('/api/expense-types');
      return await response.json();
    } catch (error) {
      console.error('خطأ في جلب أنواع المصروفات:', error);
      return [];
    }
  },

  // الحصول على الموظفين
  async getEmployees() {
    try {
      const response = await fetch('/api/employees');
      return await response.json();
    } catch (error) {
      console.error('خطأ في جلب الموظفين:', error);
      return [];
    }
  },

  // إنشاء معاملة جديدة
  async createTransaction(transactionData) {
    try {
      const response = await fetch('/.netlify/functions/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'فشل في إنشاء المعاملة');
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في إنشاء المعاملة:', error);
      return { error: error.message || 'فشل في إنشاء المعاملة' };
    }
  }
};

export default supabase;
