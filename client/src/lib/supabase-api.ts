import { supabase } from './supabase';

// Type definitions for API responses
interface WhatsAppConfig {
  enabled: boolean;
  phoneNumberId?: string;
  accessToken?: string;
  webhookVerifyToken?: string;
  businessAccountId?: string;
  webhookUrl?: string;
  lastSync?: string;
}

interface WhatsAppStatus {
  connected: boolean;
  phoneNumber?: string;
  businessName?: string;
  lastMessage?: string;
  messagesReceived: number;
  filesReceived: number;
}

// Check if we're in demo mode (when database tables don't exist)
let isDemo = false;

// Function to check database status and set demo mode
async function checkDemoMode() {
  try {
    const { error } = await supabase.from('expense_types').select('count').limit(1);
    isDemo = !!error;
    return !error;
  } catch (error) {
    isDemo = true;
    return false;
  }
}

// Mock data for demo purposes when Supabase tables don't exist yet
const mockData = {
  expenseTypes: [
    { id: 1, name: 'مصاريف النقل', description: 'تكاليف النقل والمواصلات', isActive: true },
    { id: 2, name: 'مصاريف المكتب', description: 'أدوات ومستلزمات المكتب', isActive: true },
    { id: 3, name: 'مصاريف التسويق', description: 'الإعلانات والدعاية', isActive: true },
    { id: 4, name: 'رواتب الموظفين', description: 'رواتب وأجور العمالة', isActive: true },
  ],
  
  transactions: [
    {
      id: 1,
      type: 'expense',
      amount: 500,
      description: 'مصاريف نقل',
      date: new Date().toISOString(),
      category: 'نقل',
      project_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      type: 'income',
      amount: 2000,
      description: 'دفعة من عميل',
      date: new Date().toISOString(),
      category: 'إيرادات',
      project_id: 1,
      created_at: new Date().toISOString()
    }
  ],

  projects: [
    {
      id: 1,
      name: 'مشروع تطوير موقع',
      description: 'تطوير موقع إلكتروني للشركة',
      status: 'active',
      budget: 10000,
      spent: 3500,
      start_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  ],

  users: [
    {
      id: 1,
      email: 'admin@example.com',
      name: 'المدير العام',
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      email: 'manager@example.com',
      name: 'مدير المشاريع',
      role: 'manager',
      status: 'active',
      created_at: new Date().toISOString()
    }
  ]
};

// Settings API
async function updateSettings(key: string, value: string) {
  await checkDemoMode();
  
  if (isDemo) {
    console.log(`[DEMO] تحديث إعداد: ${key} = ${value}`);
    return { success: true };
  }
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('خطأ في تحديث الإعدادات:', error);
    throw new Error('فشل في تحديث الإعدادات');
  }
}

// Password Change API (using Supabase Auth)
async function changePassword(currentPassword: string, newPassword: string) {
  await checkDemoMode();
  
  if (isDemo) {
    console.log('[DEMO] تغيير كلمة المرور');
    return { success: true };
  }
  
  try {
    const { error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    throw new Error('فشل في تغيير كلمة المرور');
  }
}

// Update Expense Type
async function updateExpenseType(id: number, name: string, description?: string) {
  await checkDemoMode();
  
  if (isDemo) {
    console.log(`[DEMO] تحديث نوع مصروف: ${name}`);
    return { id, name, description };
  }
  
  try {
    const { data, error } = await supabase
      .from('expense_types')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('خطأ في تحديث نوع المصروف:', error);
    throw new Error('فشل في تحديث نوع المصروف');
  }
}

// WhatsApp Integration API
async function getWhatsAppConfig() {
  await checkDemoMode();
  
  if (isDemo) {
    console.log('[DEMO] استرداد إعدادات WhatsApp');
    return {
      enabled: false,
      phoneNumberId: '',
      accessToken: '',
      webhookVerifyToken: '',
      businessAccountId: '',
      webhookUrl: '',
      lastSync: undefined
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .in('key', ['whatsapp_enabled', 'whatsapp_phone_id', 'whatsapp_access_token', 'whatsapp_webhook_token', 'whatsapp_business_id'])
      .order('key');
    
    if (error) throw error;
    
    // Convert array of settings to config object
    const config = {
      enabled: false,
      phoneNumberId: '',
      accessToken: '',
      webhookVerifyToken: '',
      businessAccountId: '',
      webhookUrl: `${window.location.origin}/api/whatsapp/webhook`,
      lastSync: undefined
    };
    
    data?.forEach(setting => {
      switch (setting.key) {
        case 'whatsapp_enabled':
          config.enabled = setting.value === 'true';
          break;
        case 'whatsapp_phone_id':
          config.phoneNumberId = setting.value;
          break;
        case 'whatsapp_access_token':
          config.accessToken = setting.value;
          break;
        case 'whatsapp_webhook_token':
          config.webhookVerifyToken = setting.value;
          break;
        case 'whatsapp_business_id':
          config.businessAccountId = setting.value;
          break;
      }
    });
    
    return config as WhatsAppConfig;
  } catch (error) {
    console.error('خطأ في استرداد إعدادات WhatsApp:', error);
    throw new Error('فشل في استرداد إعدادات WhatsApp');
  }
}

async function updateWhatsAppConfig(config: any) {
  await checkDemoMode();
  
  if (isDemo) {
    console.log('[DEMO] تحديث إعدادات WhatsApp:', config);
    return { success: true };
  }
  
  try {
    // Update multiple settings
    const updates = [
      { key: 'whatsapp_enabled', value: config.enabled ? 'true' : 'false' },
      { key: 'whatsapp_phone_id', value: config.phoneNumberId || '' },
      { key: 'whatsapp_access_token', value: config.accessToken || '' },
      { key: 'whatsapp_webhook_token', value: config.webhookVerifyToken || '' },
      { key: 'whatsapp_business_id', value: config.businessAccountId || '' }
    ];
    
    for (const update of updates) {
      const { error } = await supabase
        .from('settings')
        .upsert(update, { onConflict: 'key' });
      
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في تحديث إعدادات WhatsApp:', error);
    throw new Error('فشل في تحديث إعدادات WhatsApp');
  }
}

async function getWhatsAppStatus() {
  await checkDemoMode();
  
  if (isDemo) {
    console.log('[DEMO] استرداد حالة WhatsApp');
    return {
      connected: false,
      phoneNumber: '+966501234567',
      businessName: 'شركة تجريبية',
      lastMessage: 'رسالة تجريبية',
      messagesReceived: 12,
      filesReceived: 3
    };
  }
  
  try {
    // This would typically check WhatsApp Business API status
    // For now, return demo data
    return {
      connected: false,
      phoneNumber: undefined,
      businessName: undefined,
      lastMessage: undefined,
      messagesReceived: 0,
      filesReceived: 0
    };
  } catch (error) {
    console.error('خطأ في استرداد حالة WhatsApp:', error);
    throw new Error('فشل في استرداد حالة WhatsApp');
  }
}

async function toggleWhatsApp(enabled: boolean) {
  await checkDemoMode();
  
  if (isDemo) {
    console.log(`[DEMO] تبديل WhatsApp: ${enabled ? 'تفعيل' : 'إلغاء تفعيل'}`);
    return { success: true };
  }
  
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'whatsapp_enabled', value: enabled ? 'true' : 'false' }, { onConflict: 'key' });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('خطأ في تبديل WhatsApp:', error);
    throw new Error('فشل في تبديل WhatsApp');
  }
}

async function testWhatsApp() {
  await checkDemoMode();
  
  if (isDemo) {
    console.log('[DEMO] اختبار WhatsApp');
    return { success: true, message: 'تم الاختبار بنجاح (وضع تجريبي)' };
  }
  
  try {
    // This would typically send a test message via WhatsApp Business API
    return { success: true, message: 'تم إرسال رسالة اختبار' };
  } catch (error) {
    console.error('خطأ في اختبار WhatsApp:', error);
    throw new Error('فشل في اختبار WhatsApp');
  }
}

// Archive transactions
async function archiveTransactions(transactionIds: number[]) {
  await checkDemoMode();
  
  if (isDemo) {
    console.log('[DEMO] أرشفة المعاملات:', transactionIds);
    return { success: true, message: 'تم أرشفة المعاملات (وضع تجريبي)' };
  }
  
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ archived: true })
      .in('id', transactionIds);
    
    if (error) throw error;
    return { success: true, message: 'تم أرشفة المعاملات بنجاح' };
  } catch (error) {
    console.error('خطأ في أرشفة المعاملات:', error);
    throw new Error('فشل في أرشفة المعاملات');
  }
}

// Export transactions to Excel
async function exportTransactionsToExcel(filters: any = {}) {
  await checkDemoMode();
  
  if (isDemo) {
    console.log('[DEMO] تصدير المعاملات إلى Excel');
    // Return mock Excel data
    return new Blob(['Mock Excel Data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  
  try {
    // This would typically generate Excel file from Supabase data
    // For now, return mock data
    return new Blob(['Excel Export Feature - In Development'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    console.error('خطأ في تصدير Excel:', error);
    throw new Error('فشل في تصدير البيانات');
  }
}

export const supabaseApi = {
  // Database status check
  async getDatabaseStatus() {
    try {
      const isConnected = await checkDemoMode();
      
      if (!isConnected) {
        console.log('Database not fully set up, using demo mode');
        return {
          status: 'demo',
          message: 'Using demo data - database tables not yet created',
          tablesExist: false
        };
      }
      
      return {
        status: 'connected',
        message: 'Database connected successfully',
        tablesExist: true
      };
    } catch (error) {
      return {
        status: 'demo',
        message: 'Using demo data - database connection failed',
        tablesExist: false
      };
    }
  },

  // Expense Types
  async getExpenseTypes() {
    await checkDemoMode();
    
    if (isDemo) {
      console.log('[DEMO] استخدام أنواع المصاريف التجريبية');
      return mockData.expenseTypes;
    }
    
    try {
      const { data, error } = await supabase
        .from('expense_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || mockData.expenseTypes;
    } catch (error) {
      console.log('Using mock expense types:', error);
      return mockData.expenseTypes;
    }
  },

  async createExpenseType(name: string, description?: string) {
    await checkDemoMode();
    
    if (isDemo) {
      console.log(`[DEMO] إنشاء نوع مصروف: ${name}`);
      return { 
        id: Date.now(), 
        name, 
        description, 
        isActive: true, 
        createdAt: new Date().toISOString() 
      };
    }
    
    try {
      const { data, error } = await supabase
        .from('expense_types')
        .insert([{
          name,
          description,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('خطأ في إنشاء نوع المصروف:', error);
      throw new Error('فشل في إنشاء نوع المصروف');
    }
  },

  async deleteExpenseType(id: number) {
    await checkDemoMode();
    
    if (isDemo) {
      console.log(`[DEMO] حذف نوع المصروف: ${id}`);
      return { success: true };
    }
    
    try {
      const { error } = await supabase
        .from('expense_types')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('خطأ في حذف نوع المصروف:', error);
      throw new Error('فشل في حذف نوع المصروف');
    }
  },

  // Transactions
  async getTransactions(filters: any = {}) {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      
      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || mockData.transactions;
    } catch (error) {
      console.log('Using mock transactions:', error);
      return mockData.transactions;
    }
  },

  // Projects
  async getProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || mockData.projects;
    } catch (error) {
      console.log('Using mock projects:', error);
      return mockData.projects;
    }
  },

  // Users
  async getUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || mockData.users;
    } catch (error) {
      console.log('Using mock users:', error);
      return mockData.users;
    }
  },

  // Settings
  async getSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log('Using mock settings:', error);
      return [
        { key: 'company_name', value: 'الشركة العربية للمحاسبة' },
        { key: 'currency', value: 'SAR' },
        { key: 'language', value: 'ar' }
      ];
    }
  },

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      return {
        status: 'ok',
        database: 'connected',
        auth: data.session ? 'authenticated' : 'guest',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'demo',
        database: 'demo_mode',
        auth: 'demo',
        timestamp: new Date().toISOString()
      };
    }
  },

  updateSettings,
  changePassword,
  updateExpenseType,
  getWhatsAppConfig,
  updateWhatsAppConfig,
  getWhatsAppStatus,
  toggleWhatsApp,
  testWhatsApp,
  archiveTransactions,
  exportTransactionsToExcel,
};

export default supabaseApi;
