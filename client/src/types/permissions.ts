// 🔐 أنواع الصلاحيات والمستخدمين
// ===================================

export type Permission = 
  // صلاحيات عامة
  | 'view_dashboard'
  | 'view_reports'
  | 'export_data'
  
  // صلاحيات المشاريع
  | 'view_projects'
  | 'create_project'
  | 'edit_project'
  | 'delete_project'
  | 'manage_project_users'
  
  // صلاحيات المعاملات المالية
  | 'view_transactions'
  | 'create_transaction'
  | 'edit_transaction'
  | 'delete_transaction'
  | 'approve_transaction'
  
  // صلاحيات المستخدمين
  | 'view_users'
  | 'create_user'
  | 'edit_user'
  | 'delete_user'
  | 'manage_users'
  | 'assign_permissions'
  
  // صلاحيات الموظفين
  | 'view_employees'
  | 'create_employee'
  | 'edit_employee'
  | 'delete_employee'
  | 'manage_salaries'
  
  // صلاحيات المستندات
  | 'view_documents'
  | 'upload_document'
  | 'edit_document'
  | 'delete_document'
  | 'manage_documents'
  
  // صلاحيات المستحقات
  | 'view_receivables'
  | 'create_receivable'
  | 'edit_receivable'
  | 'delete_receivable'
  | 'manage_payments'
  
  // صلاحيات الإعدادات والإدارة
  | 'view_settings'
  | 'edit_settings'
  | 'manage_system'
  | 'view_activity_logs'
  | 'backup_system'
  
  // صلاحيات محاسبية متقدمة
  | 'view_ledger'
  | 'edit_ledger'
  | 'close_period'
  | 'generate_reports';

export interface UserProfile {
  id: string;
  full_name: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  permissions: Permission[];
  project_ids?: string[];
  created_at: string;
  projects: Array<{
    project_id: string;
    project_name: string;
    role_in_project?: string;
  }>;
}

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// مجموعات الصلاحيات المحددة مسبقاً
export const PERMISSION_GROUPS = {
  ADMIN: [
    'view_dashboard',
    'view_reports',
    'export_data',
    'view_projects',
    'create_project',
    'edit_project',
    'delete_project',
    'manage_project_users',
    'view_transactions',
    'create_transaction',
    'edit_transaction',
    'delete_transaction',
    'approve_transaction',
    'view_users',
    'create_user',
    'edit_user',
    'delete_user',
    'manage_users',
    'assign_permissions',
    'view_employees',
    'create_employee',
    'edit_employee',
    'delete_employee',
    'manage_salaries',
    'view_documents',
    'upload_document',
    'edit_document',
    'delete_document',
    'manage_documents',
    'view_receivables',
    'create_receivable',
    'edit_receivable',
    'delete_receivable',
    'manage_payments',
    'view_settings',
    'edit_settings',
    'manage_system',
    'view_activity_logs',
    'backup_system',
    'view_ledger',
    'edit_ledger',
    'close_period',
    'generate_reports'
  ] as Permission[],
  
  MANAGER: [
    'view_dashboard',
    'view_reports',
    'export_data',
    'view_projects',
    'create_project',
    'edit_project',
    'manage_project_users',
    'view_transactions',
    'create_transaction',
    'edit_transaction',
    'approve_transaction',
    'view_users',
    'view_employees',
    'create_employee',
    'edit_employee',
    'manage_salaries',
    'view_documents',
    'upload_document',
    'edit_document',
    'view_receivables',
    'create_receivable',
    'edit_receivable',
    'manage_payments',
    'view_settings',
    'view_ledger',
    'generate_reports'
  ] as Permission[],
  
  USER: [
    'view_dashboard',
    'view_projects',
    'view_transactions',
    'create_transaction',
    'view_employees',
    'view_documents',
    'upload_document',
    'view_receivables',
    'create_receivable',
    'manage_payments'
  ] as Permission[],
  
  VIEWER: [
    'view_dashboard',
    'view_projects',
    'view_transactions',
    'view_employees',
    'view_documents',
    'view_receivables'
  ] as Permission[],
  
  PROJECT_MANAGER: [
    'view_dashboard',
    'view_reports',
    'view_projects',
    'edit_project',
    'view_transactions',
    'create_transaction',
    'view_employees',
    'create_employee',
    'edit_employee',
    'manage_salaries',
    'view_documents',
    'upload_document',
    'edit_document',
    'view_receivables',
    'create_receivable',
    'edit_receivable',
    'manage_payments'
  ] as Permission[],
  
  ACCOUNTANT: [
    'view_dashboard',
    'view_reports',
    'export_data',
    'view_projects',
    'view_transactions',
    'create_transaction',
    'edit_transaction',
    'view_receivables',
    'create_receivable',
    'edit_receivable',
    'manage_payments',
    'view_ledger',
    'edit_ledger',
    'generate_reports'
  ] as Permission[]
} as const;

// تسميات الصلاحيات بالعربية
export const PERMISSION_LABELS: Record<Permission, string> = {
  // صلاحيات عامة
  'view_dashboard': 'عرض لوحة التحكم',
  'view_reports': 'عرض التقارير',
  'export_data': 'تصدير البيانات',
  
  // صلاحيات المشاريع
  'view_projects': 'عرض المشاريع',
  'create_project': 'إنشاء مشروع',
  'edit_project': 'تعديل المشاريع',
  'delete_project': 'حذف المشاريع',
  'manage_project_users': 'إدارة مستخدمي المشاريع',
  
  // صلاحيات المعاملات المالية
  'view_transactions': 'عرض المعاملات المالية',
  'create_transaction': 'إنشاء معاملة مالية',
  'edit_transaction': 'تعديل المعاملات المالية',
  'delete_transaction': 'حذف المعاملات المالية',
  'approve_transaction': 'اعتماد المعاملات المالية',
  
  // صلاحيات المستخدمين
  'view_users': 'عرض المستخدمين',
  'create_user': 'إنشاء مستخدم',
  'edit_user': 'تعديل المستخدمين',
  'delete_user': 'حذف المستخدمين',
  'manage_users': 'إدارة المستخدمين',
  'assign_permissions': 'تخصيص الصلاحيات',
  
  // صلاحيات الموظفين
  'view_employees': 'عرض الموظفين',
  'create_employee': 'إنشاء موظف',
  'edit_employee': 'تعديل الموظفين',
  'delete_employee': 'حذف الموظفين',
  'manage_salaries': 'إدارة الرواتب',
  
  // صلاحيات المستندات
  'view_documents': 'عرض المستندات',
  'upload_document': 'رفع مستند',
  'edit_document': 'تعديل المستندات',
  'delete_document': 'حذف المستندات',
  'manage_documents': 'إدارة المستندات',
  
  // صلاحيات المستحقات
  'view_receivables': 'عرض المستحقات',
  'create_receivable': 'إنشاء مستحق',
  'edit_receivable': 'تعديل المستحقات',
  'delete_receivable': 'حذف المستحقات',
  'manage_payments': 'إدارة المدفوعات',
  
  // صلاحيات الإعدادات والإدارة
  'view_settings': 'عرض الإعدادات',
  'edit_settings': 'تعديل الإعدادات',
  'manage_system': 'إدارة النظام',
  'view_activity_logs': 'عرض سجل الأنشطة',
  'backup_system': 'نسخ احتياطي للنظام',
  
  // صلاحيات محاسبية متقدمة
  'view_ledger': 'عرض دفتر الأستاذ',
  'edit_ledger': 'تعديل دفتر الأستاذ',
  'close_period': 'إقفال الفترة المحاسبية',
  'generate_reports': 'إنشاء التقارير'
};
