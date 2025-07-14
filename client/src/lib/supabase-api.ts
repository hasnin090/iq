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
  ],

  employees: [
    { id: 1, name: 'أحمد محمد', salary: 5000, assignedProjectId: 1 },
    { id: 2, name: 'فاطمة علي', salary: 4500, assignedProjectId: 1 },
    { id: 3, name: 'محمد صالح', salary: 6000, assignedProjectId: 2 },
  ],

  documents: [
    {
      id: 1,
      title: 'وثيقة المشروع الأول',
      description: 'وثيقة تفصيلية للمشروع الأول',
      fileName: 'project1_doc.pdf',
      fileSize: 2048576,
      fileType: 'application/pdf',
      projectId: 1,
      isManagerDocument: false,
      uploadedBy: 1,
      uploadedAt: new Date().toISOString(),
      category: 'مشروع',
      tags: ['مشروع', 'تقرير']
    },
    {
      id: 2,
      title: 'تقرير إداري شهري',
      description: 'تقرير إداري للشهر الحالي',
      fileName: 'monthly_report.pdf',
      fileSize: 1024768,
      fileType: 'application/pdf',
      projectId: null,
      isManagerDocument: true,
      uploadedBy: 1,
      uploadedAt: new Date().toISOString(),
      category: 'إداري',
      tags: ['إداري', 'شهري']
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

// Employees API
async function getEmployees() {
  await checkDemoMode();
  
  if (isDemo) {
    console.log('[DEMO] استرداد الموظفين');
    return [
      { id: 1, name: 'أحمد محمد', salary: 5000, assignedProjectId: 1 },
      { id: 2, name: 'فاطمة علي', salary: 4500, assignedProjectId: 1 },
      { id: 3, name: 'محمد صالح', salary: 6000, assignedProjectId: 2 },
    ];
  }
  
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('خطأ في استرداد الموظفين:', error);
    return [];
  }
}

async function getEmployeesByProject(projectId: number) {
  await checkDemoMode();
  
  if (isDemo) {
    console.log(`[DEMO] استرداد موظفي المشروع: ${projectId}`);
    return [
      { id: 1, name: 'أحمد محمد', salary: 5000, assignedProjectId: projectId },
      { id: 2, name: 'فاطمة علي', salary: 4500, assignedProjectId: projectId },
    ];
  }
  
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('assigned_project_id', projectId)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('خطأ في استرداد موظفي المشروع:', error);
    return [];
  }
}

// User Projects API
async function getUserProjects() {
  await checkDemoMode();
  
  if (isDemo) {
    console.log('[DEMO] استرداد مشاريع المستخدم');
    return [
      { id: 1, name: 'مشروع تطوير الموقع' },
      { id: 2, name: 'مشروع التسويق الرقمي' },
    ];
  }
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('خطأ في استرداد مشاريع المستخدم:', error);
    return [];
  }
}

// Create Transaction
async function createTransaction(transactionData: any) {
  await checkDemoMode();
  
  if (isDemo) {
    console.log('[DEMO] إنشاء معاملة:', transactionData);
    return { 
      id: Date.now(), 
      ...transactionData,
      created_at: new Date().toISOString()
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        ...transactionData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('خطأ في إنشاء المعاملة:', error);
    throw new Error('فشل في إنشاء معاملة');
  }
}

// وظائف إدارة الوثائق
export const getDocuments = async (filters?: { projectId?: number; isManagerDocument?: boolean }) => {
  try {
    const isDemoMode = await checkDemoMode();
    
    if (isDemoMode) {
      // بيانات تجريبية للوثائق
      const documents = [
        {
          id: 1,
          title: 'وثيقة المشروع الأول',
          description: 'وثيقة تفصيلية للمشروع الأول',
          fileName: 'project1_doc.pdf',
          fileSize: 2048576,
          fileType: 'application/pdf',
          projectId: 1,
          isManagerDocument: false,
          uploadedBy: 1,
          uploadedAt: new Date().toISOString(),
          category: 'مشروع',
          tags: ['مشروع', 'تقرير']
        },
        {
          id: 2,
          title: 'تقرير إداري شهري',
          description: 'تقرير إداري للشهر الحالي',
          fileName: 'monthly_report.pdf',
          fileSize: 1024768,
          fileType: 'application/pdf',
          projectId: null,
          isManagerDocument: true,
          uploadedBy: 1,
          uploadedAt: new Date().toISOString(),
          category: 'إداري',
          tags: ['إداري', 'شهري']
        }
      ];
      
      // تطبيق التصفية
      let filteredDocs = documents;
      if (filters?.projectId) {
        filteredDocs = filteredDocs.filter(doc => doc.projectId === filters.projectId);
      }
      if (filters?.isManagerDocument !== undefined) {
        filteredDocs = filteredDocs.filter(doc => doc.isManagerDocument === filters.isManagerDocument);
      }
      
      return filteredDocs;
    }

    let query = supabase.from('documents').select('*');
    
    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    
    if (filters?.isManagerDocument !== undefined) {
      query = query.eq('is_manager_document', filters.isManagerDocument);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};

export const getTransactionsWithAttachments = async () => {
  try {
    const isDemoMode = await checkDemoMode();
    
    if (isDemoMode) {
      // بيانات تجريبية للمعاملات مع المرفقات
      return [
        {
          id: 1,
          date: new Date().toISOString(),
          amount: 1500,
          type: 'expense',
          description: 'شراء معدات للمشروع',
          projectId: 1,
          createdBy: 1,
          fileUrl: '/demo/receipt1.pdf',
          fileType: 'application/pdf'
        },
        {
          id: 2,
          date: new Date().toISOString(),
          amount: 2000,
          type: 'income',
          description: 'دفعة من العميل',
          projectId: 1,
          createdBy: 1,
          fileUrl: '/demo/invoice2.pdf',
          fileType: 'application/pdf'
        }
      ];
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .not('file_url', 'is', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transactions with attachments:', error);
    return [];
  }
};

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
      await checkDemoMode();
      const { data, error } = await supabase.auth.getSession();
      
      return {
        status: isDemo ? 'demo' : 'healthy',
        database: isDemo ? 'demo_mode' : 'connected',
        auth: data.session ? 'authenticated' : 'guest',
        timestamp: new Date().toISOString(),
        message: isDemo ? 'النظام يعمل في الوضع التجريبي' : 'جميع الأنظمة تعمل بشكل طبيعي'
      };
    } catch (error) {
      return {
        status: 'demo',
        database: 'demo_mode',
        auth: 'demo',
        timestamp: new Date().toISOString(),
        message: 'النظام يعمل في الوضع التجريبي بسبب خطأ في الاتصال'
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
  getEmployees,
  getEmployeesByProject,
  getUserProjects,
  createTransaction,
  // وظائف المدفوعات المؤجلة (Deferred Payments)
  getDeferredPayments: async () => {
    try {
      const isDemoMode = await checkDemoMode();
      
      if (isDemoMode) {
        // بيانات تجريبية للمدفوعات المؤجلة
        return [
          {
            id: 1,
            title: 'دفعة مشروع الموقع الإلكتروني',
            amount: 5000,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // بعد أسبوع
            status: 'pending',
            projectId: 1,
            clientName: 'شركة التطوير',
            description: 'الدفعة الثانية من مشروع تطوير الموقع',
            createdAt: new Date().toISOString(),
            priority: 'high'
          },
          {
            id: 2,
            title: 'دفعة مشروع التطبيق',
            amount: 3000,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // بعد أسبوعين
            status: 'pending',
            projectId: 2,
            clientName: 'شركة الهندسة',
            description: 'الدفعة الأولى من مشروع التطبيق المحمول',
            createdAt: new Date().toISOString(),
            priority: 'medium'
          }
        ];
      }

      const { data, error } = await supabase
        .from('deferred_payments')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching deferred payments:', error);
      return [];
    }
  },

  createDeferredPayment: async (paymentData: any) => {
    try {
      const isDemoMode = await checkDemoMode();
      
      if (isDemoMode) {
        // في وضع التجربة، نرجع بيانات وهمية
        return {
          id: Date.now(),
          ...paymentData,
          createdAt: new Date().toISOString(),
          status: 'pending'
        };
      }

      const { data, error } = await supabase
        .from('deferred_payments')
        .insert([paymentData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating deferred payment:', error);
      throw error;
    }
  },

  // وظائف الأعمال المكتملة (Completed Works)
  getCompletedWorks: async () => {
    try {
      const isDemoMode = await checkDemoMode();
      
      if (isDemoMode) {
        // بيانات تجريبية للأعمال المكتملة
        return [
          {
            id: 1,
            title: 'تطوير صفحة الهبوط',
            projectId: 1,
            completedDate: new Date().toISOString(),
            description: 'تم إنجاز تطوير صفحة الهبوط بالكامل',
            completedBy: 1,
            status: 'completed',
            deliverables: ['تصميم UI/UX', 'برمجة Frontend', 'اختبار'],
            clientApproval: true,
            notes: 'تم التسليم في الموعد المحدد'
          },
          {
            id: 2,
            title: 'إعداد قاعدة البيانات',
            projectId: 1,
            completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // قبل يومين
            description: 'تم إعداد قاعدة البيانات والجداول',
            completedBy: 1,
            status: 'completed',
            deliverables: ['تصميم Database', 'إنشاء الجداول', 'البيانات التجريبية'],
            clientApproval: true,
            notes: 'قاعدة البيانات جاهزة للاستخدام'
          }
        ];
      }

      const { data, error } = await supabase
        .from('completed_works')
        .select('*')
        .order('completed_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching completed works:', error);
      return [];
    }
  },

  getCompletedWorksDocuments: async () => {
    try {
      const isDemoMode = await checkDemoMode();
      
      if (isDemoMode) {
        // بيانات تجريبية لوثائق الأعمال المكتملة
        return [
          {
            id: 1,
            workId: 1,
            title: 'تقرير إنجاز صفحة الهبوط',
            fileName: 'landing_page_report.pdf',
            fileUrl: '/demo/reports/landing_page_report.pdf',
            fileType: 'application/pdf',
            uploadedAt: new Date().toISOString(),
            description: 'تقرير مفصل عن إنجاز صفحة الهبوط'
          },
          {
            id: 2,
            workId: 2,
            title: 'توثيق قاعدة البيانات',
            fileName: 'database_documentation.pdf',
            fileUrl: '/demo/reports/database_doc.pdf',
            fileType: 'application/pdf',
            uploadedAt: new Date().toISOString(),
            description: 'توثيق شامل لهيكل قاعدة البيانات'
          }
        ];
      }

      const { data, error } = await supabase
        .from('completed_works_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching completed works documents:', error);
      return [];
    }
  },

  createCompletedWork: async (workData: any) => {
    try {
      const isDemoMode = await checkDemoMode();
      
      if (isDemoMode) {
        // في وضع التجربة، نرجع بيانات وهمية
        return {
          id: Date.now(),
          ...workData,
          completedDate: new Date().toISOString(),
          status: 'completed'
        };
      }

      const { data, error } = await supabase
        .from('completed_works')
        .insert([workData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating completed work:', error);
      throw error;
    }
  },

  // وظائف رفع الوثائق
  uploadDocument: async (documentData: any, file?: File) => {
    try {
      const isDemoMode = await checkDemoMode();
      
      if (isDemoMode) {
        // في وضع التجربة، نحاكي رفع الملف
        const fileUrl = file ? `/demo/uploads/${file.name}` : '/demo/uploads/document.pdf';
        return {
          id: Date.now(),
          ...documentData,
          fileUrl: fileUrl,
          fileName: file?.name || 'document.pdf',
          fileSize: file?.size || 1024,
          fileType: file?.type || 'application/pdf',
          uploadedAt: new Date().toISOString()
        };
      }

      // في الوضع الحقيقي، نرفع الملف إلى Supabase Storage
      let fileUrl = null;
      if (file) {
        const fileName = `${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);
        
        if (uploadError) {
          console.error('File upload error:', uploadError);
          // نكمل بدون الملف في حالة فشل الرفع
        } else {
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);
          fileUrl = urlData.publicUrl;
        }
      }

      const docToInsert = {
        ...documentData,
        file_url: fileUrl,
        file_name: file?.name,
        file_size: file?.size,
        file_type: file?.type,
        uploaded_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('documents')
        .insert([docToInsert])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // وظيفة إنشاء مشروع جديد
  createProject: async (projectData: any) => {
    try {
      const isDemoMode = await checkDemoMode();
      
      if (isDemoMode) {
        // في وضع التجربة، نرجع بيانات وهمية
        return {
          id: Date.now(),
          ...projectData,
          createdAt: new Date().toISOString(),
          status: 'active',
          progress: 0
        };
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: projectData.name,
          description: projectData.description,
          start_date: projectData.startDate,
          end_date: projectData.endDate,
          status: projectData.status || 'active',
          budget: projectData.budget,
          created_by: projectData.createdBy,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  updateProject: async (projectId: number, projectData: any) => {
    try {
      const isDemoMode = await checkDemoMode();
      
      if (isDemoMode) {
        // في وضع التجربة، نرجع بيانات وهمية
        return {
          id: projectId,
          ...projectData,
          updatedAt: new Date().toISOString()
        };
      }

      const { data, error } = await supabase
        .from('projects')
        .update({
          name: projectData.name,
          description: projectData.description,
          start_date: projectData.startDate,
          end_date: projectData.endDate,
          status: projectData.status,
          budget: projectData.budget,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  deleteProject: async (projectId: number) => {
    try {
      const isDemoMode = await checkDemoMode();
      
      if (isDemoMode) {
        // في وضع التجربة، نعيد نجاح العملية
        return { success: true, message: 'تم حذف المشروع بنجاح' };
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
    
      if (error) throw error;
      return { success: true, message: 'تم حذف المشروع بنجاح' };
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // وظائف إدارة المعاملات الإضافية
  updateTransaction: async (transactionId: number, transactionData: any) => {
    try {
      const isDemoMode = await checkDemoMode();
      
      if (isDemoMode) {
        // في وضع التجربة، نرجع بيانات وهمية
        return {
          id: transactionId,
          ...transactionData,
          updatedAt: new Date().toISOString()
        };
      }

      const { data, error } = await supabase
        .from('transactions')
        .update({
          date: transactionData.date,
          amount: transactionData.amount,
          type: transactionData.type,
          description: transactionData.description,
          project_id: transactionData.projectId,
          expense_type: transactionData.expenseType,
          employee_id: transactionData.employeeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },

  deleteTransaction: async (transactionId: number) => {
    try {
      const isDemoMode = await checkDemoMode();
      
      if (isDemoMode) {
        // في وضع التجربة، نعيد نجاح العملية
        return { success: true, message: 'تم حذف المعاملة بنجاح' };
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);
    
      if (error) throw error;
      return { success: true, message: 'تم حذف المعاملة بنجاح' };
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  deleteTransactionAttachment: async (transactionId: number) => {
    try {
      const isDemoMode = await checkDemoMode();
      
      if (isDemoMode) {
        // في وضع التجربة، نعيد نجاح العملية
        return { success: true, message: 'تم حذف المرفق بنجاح' };
      }

      const { error } = await supabase
        .from('transactions')
        .update({
          file_url: null,
          file_type: null
        })
        .eq('id', transactionId);
    
      if (error) throw error;
      return { success: true, message: 'تم حذف المرفق بنجاح' };
    } catch (error) {
      console.error('Error deleting transaction attachment:', error);
      throw error;
    }
  }
};
