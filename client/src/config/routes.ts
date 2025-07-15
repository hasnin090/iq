import { Permission } from '../types/permissions';

// 🗺️ تكوين مسارات النظام مع الصلاحيات
// =====================================

export interface RouteConfig {
  path: string;
  component: string;
  exact?: boolean;
  requiredPermission?: Permission | Permission[];
  requireAll?: boolean;
  label: string;
  description?: string;
  icon?: string;
  category?: string;
  visible?: boolean;
  isPublic?: boolean;
}

// المسارات العامة - متاحة للجميع
export const PUBLIC_ROUTES: RouteConfig[] = [
  {
    path: '/login',
    component: 'Login',
    exact: true,
    label: 'تسجيل الدخول',
    description: 'صفحة تسجيل الدخول',
    icon: 'login',
    isPublic: true,
    visible: false
  },
  {
    path: '/register',
    component: 'Register',
    exact: true,
    label: 'إنشاء حساب',
    description: 'صفحة إنشاء حساب جديد',
    icon: 'user-plus',
    isPublic: true,
    visible: false
  },
  {
    path: '/forgot-password',
    component: 'ForgotPassword',
    exact: true,
    label: 'نسيان كلمة المرور',
    description: 'صفحة استعادة كلمة المرور',
    icon: 'key',
    isPublic: true,
    visible: false
  }
];

// المسارات المحمية - تتطلب صلاحيات محددة
export const PROTECTED_ROUTES: RouteConfig[] = [
  // الصفحة الرئيسية والإحصائيات
  {
    path: '/',
    component: 'Dashboard',
    exact: true,
    requiredPermission: 'view_dashboard',
    label: 'الصفحة الرئيسية',
    description: 'لوحة التحكم والإحصائيات العامة',
    icon: 'home',
    category: 'main',
    visible: true
  },
  {
    path: '/dashboard',
    component: 'Dashboard',
    exact: true,
    requiredPermission: 'view_dashboard',
    label: 'لوحة التحكم',
    description: 'الإحصائيات والبيانات العامة',
    icon: 'chart-bar',
    category: 'main',
    visible: true
  },
  {
    path: '/statistics',
    component: 'Statistics',
    exact: true,
    requiredPermission: 'view_statistics',
    label: 'الإحصائيات',
    description: 'التقارير والإحصائيات التفصيلية',
    icon: 'chart-line',
    category: 'reports',
    visible: true
  },

  // إدارة المشاريع
  {
    path: '/projects',
    component: 'ProjectList',
    exact: true,
    requiredPermission: 'view_projects',
    label: 'المشاريع',
    description: 'عرض وإدارة المشاريع',
    icon: 'folder',
    category: 'projects',
    visible: true
  },
  {
    path: '/projects/new',
    component: 'ProjectForm',
    exact: true,
    requiredPermission: 'create_project',
    label: 'مشروع جديد',
    description: 'إنشاء مشروع جديد',
    icon: 'plus',
    category: 'projects',
    visible: false
  },
  {
    path: '/projects/:id',
    component: 'ProjectDetails',
    exact: true,
    requiredPermission: 'view_project_details',
    label: 'تفاصيل المشروع',
    description: 'عرض تفاصيل المشروع',
    icon: 'eye',
    category: 'projects',
    visible: false
  },
  {
    path: '/projects/:id/edit',
    component: 'ProjectForm',
    exact: true,
    requiredPermission: 'edit_project',
    label: 'تعديل المشروع',
    description: 'تعديل بيانات المشروع',
    icon: 'edit',
    category: 'projects',
    visible: false
  },

  // إدارة المعاملات
  {
    path: '/transactions',
    component: 'TransactionList',
    exact: true,
    requiredPermission: 'view_transactions',
    label: 'المعاملات',
    description: 'عرض وإدارة المعاملات المالية',
    icon: 'credit-card',
    category: 'transactions',
    visible: true
  },
  {
    path: '/transactions/new',
    component: 'TransactionForm',
    exact: true,
    requiredPermission: 'create_transaction',
    label: 'معاملة جديدة',
    description: 'إنشاء معاملة مالية جديدة',
    icon: 'plus',
    category: 'transactions',
    visible: false
  },
  {
    path: '/transactions/:id',
    component: 'TransactionDetails',
    exact: true,
    requiredPermission: 'view_transaction_details',
    label: 'تفاصيل المعاملة',
    description: 'عرض تفاصيل المعاملة المالية',
    icon: 'eye',
    category: 'transactions',
    visible: false
  },
  {
    path: '/transactions/:id/edit',
    component: 'TransactionForm',
    exact: true,
    requiredPermission: 'edit_transaction',
    label: 'تعديل المعاملة',
    description: 'تعديل بيانات المعاملة المالية',
    icon: 'edit',
    category: 'transactions',
    visible: false
  },

  // إدارة المستخدمين
  {
    path: '/users',
    component: 'UserList',
    exact: true,
    requiredPermission: 'view_users',
    label: 'المستخدمين',
    description: 'عرض وإدارة المستخدمين',
    icon: 'users',
    category: 'users',
    visible: true
  },
  {
    path: '/users/new',
    component: 'UserForm',
    exact: true,
    requiredPermission: 'create_user',
    label: 'مستخدم جديد',
    description: 'إضافة مستخدم جديد',
    icon: 'user-plus',
    category: 'users',
    visible: false
  },
  {
    path: '/users/:id',
    component: 'UserDetails',
    exact: true,
    requiredPermission: 'view_user_details',
    label: 'تفاصيل المستخدم',
    description: 'عرض تفاصيل المستخدم',
    icon: 'user',
    category: 'users',
    visible: false
  },
  {
    path: '/users/:id/edit',
    component: 'UserForm',
    exact: true,
    requiredPermission: 'edit_user',
    label: 'تعديل المستخدم',
    description: 'تعديل بيانات المستخدم',
    icon: 'user-edit',
    category: 'users',
    visible: false
  },

  // إدارة الموظفين
  {
    path: '/employees',
    component: 'EmployeeList',
    exact: true,
    requiredPermission: 'view_employees',
    label: 'الموظفين',
    description: 'عرض وإدارة الموظفين',
    icon: 'id-badge',
    category: 'employees',
    visible: true
  },
  {
    path: '/employees/new',
    component: 'EmployeeForm',
    exact: true,
    requiredPermission: 'create_employee',
    label: 'موظف جديد',
    description: 'إضافة موظف جديد',
    icon: 'plus',
    category: 'employees',
    visible: false
  },
  {
    path: '/employees/:id',
    component: 'EmployeeDetails',
    exact: true,
    requiredPermission: 'view_employee_details',
    label: 'تفاصيل الموظف',
    description: 'عرض تفاصيل الموظف',
    icon: 'id-card',
    category: 'employees',
    visible: false
  },

  // إدارة المستندات
  {
    path: '/documents',
    component: 'DocumentList',
    exact: true,
    requiredPermission: 'view_documents',
    label: 'المستندات',
    description: 'عرض وإدارة المستندات',
    icon: 'document',
    category: 'documents',
    visible: true
  },
  {
    path: '/documents/upload',
    component: 'DocumentUpload',
    exact: true,
    requiredPermission: 'upload_document',
    label: 'رفع مستند',
    description: 'رفع مستند جديد',
    icon: 'upload',
    category: 'documents',
    visible: false
  },

  // إدارة الذمم
  {
    path: '/receivables',
    component: 'ReceivableList',
    exact: true,
    requiredPermission: 'view_receivables',
    label: 'الذمم المدينة',
    description: 'عرض وإدارة الذمم المدينة',
    icon: 'currency-dollar',
    category: 'receivables',
    visible: true
  },
  {
    path: '/receivables/new',
    component: 'ReceivableForm',
    exact: true,
    requiredPermission: 'create_receivable',
    label: 'ذمة جديدة',
    description: 'إنشاء ذمة مدينة جديدة',
    icon: 'plus',
    category: 'receivables',
    visible: false
  },

  // المحاسبة
  {
    path: '/accounting',
    component: 'AccountingDashboard',
    exact: true,
    requiredPermission: 'view_accounting',
    label: 'المحاسبة',
    description: 'النظام المحاسبي',
    icon: 'calculator',
    category: 'accounting',
    visible: true
  },
  {
    path: '/accounting/accounts',
    component: 'ChartOfAccounts',
    exact: true,
    requiredPermission: 'view_chart_of_accounts',
    label: 'دليل الحسابات',
    description: 'عرض وإدارة دليل الحسابات',
    icon: 'list',
    category: 'accounting',
    visible: true
  },
  {
    path: '/accounting/journal',
    component: 'JournalEntries',
    exact: true,
    requiredPermission: 'view_journal_entries',
    label: 'القيود اليومية',
    description: 'عرض وإدارة القيود اليومية',
    icon: 'book-open',
    category: 'accounting',
    visible: true
  },
  {
    path: '/accounting/trial-balance',
    component: 'TrialBalance',
    exact: true,
    requiredPermission: 'view_trial_balance',
    label: 'ميزان المراجعة',
    description: 'عرض ميزان المراجعة',
    icon: 'scale',
    category: 'accounting',
    visible: true
  },

  // التقارير
  {
    path: '/reports',
    component: 'ReportDashboard',
    exact: true,
    requiredPermission: 'view_reports',
    label: 'التقارير',
    description: 'مركز التقارير',
    icon: 'document-report',
    category: 'reports',
    visible: true
  },
  {
    path: '/reports/financial',
    component: 'FinancialReports',
    exact: true,
    requiredPermission: 'view_financial_reports',
    label: 'التقارير المالية',
    description: 'التقارير المالية التفصيلية',
    icon: 'chart-pie',
    category: 'reports',
    visible: true
  },
  {
    path: '/reports/project',
    component: 'ProjectReports',
    exact: true,
    requiredPermission: 'view_project_reports',
    label: 'تقارير المشاريع',
    description: 'تقارير أداء المشاريع',
    icon: 'presentation-chart-line',
    category: 'reports',
    visible: true
  },

  // الإعدادات
  {
    path: '/settings',
    component: 'Settings',
    exact: true,
    requiredPermission: 'view_settings',
    label: 'الإعدادات',
    description: 'إعدادات النظام',
    icon: 'cog',
    category: 'settings',
    visible: true
  },
  {
    path: '/settings/system',
    component: 'SystemSettings',
    exact: true,
    requiredPermission: 'manage_system_settings',
    label: 'إعدادات النظام',
    description: 'إعدادات النظام العامة',
    icon: 'server',
    category: 'settings',
    visible: true
  },
  {
    path: '/settings/backup',
    component: 'BackupSettings',
    exact: true,
    requiredPermission: 'manage_backup',
    label: 'النسخ الاحتياطي',
    description: 'إدارة النسخ الاحتياطية',
    icon: 'database',
    category: 'settings',
    visible: true
  },

  // الملف الشخصي
  {
    path: '/profile',
    component: 'Profile',
    exact: true,
    label: 'الملف الشخصي',
    description: 'عرض وتعديل الملف الشخصي',
    icon: 'user-circle',
    category: 'profile',
    visible: true
  },
  {
    path: '/profile/edit',
    component: 'EditProfile',
    exact: true,
    label: 'تعديل الملف الشخصي',
    description: 'تعديل بيانات الملف الشخصي',
    icon: 'pencil',
    category: 'profile',
    visible: false
  }
];

// جميع المسارات
export const ALL_ROUTES: RouteConfig[] = [
  ...PUBLIC_ROUTES,
  ...PROTECTED_ROUTES
];

// تجميع المسارات حسب الفئة
export const ROUTE_CATEGORIES = {
  main: 'الرئيسية',
  projects: 'المشاريع',
  transactions: 'المعاملات',
  users: 'المستخدمين',
  employees: 'الموظفين',
  documents: 'المستندات',
  receivables: 'الذمم',
  accounting: 'المحاسبة',
  reports: 'التقارير',
  settings: 'الإعدادات',
  profile: 'الملف الشخصي'
};

// وظائف مساعدة للمسارات
export class RouteUtils {
  /**
   * الحصول على مسار بواسطة المسار
   */
  static getRouteByPath(path: string): RouteConfig | undefined {
    return ALL_ROUTES.find(route => route.path === path);
  }

  /**
   * الحصول على المسارات حسب الفئة
   */
  static getRoutesByCategory(category: string): RouteConfig[] {
    return PROTECTED_ROUTES.filter(route => route.category === category);
  }

  /**
   * الحصول على المسارات المرئية
   */
  static getVisibleRoutes(): RouteConfig[] {
    return PROTECTED_ROUTES.filter(route => route.visible === true);
  }

  /**
   * الحصول على المسارات العامة
   */
  static getPublicRoutes(): RouteConfig[] {
    return PUBLIC_ROUTES;
  }

  /**
   * الحصول على المسارات المحمية
   */
  static getProtectedRoutes(): RouteConfig[] {
    return PROTECTED_ROUTES;
  }

  /**
   * التحقق من كون المسار عام
   */
  static isPublicRoute(path: string): boolean {
    return PUBLIC_ROUTES.some(route => route.path === path);
  }

  /**
   * التحقق من كون المسار محمي
   */
  static isProtectedRoute(path: string): boolean {
    return PROTECTED_ROUTES.some(route => route.path === path);
  }

  /**
   * الحصول على الصلاحيات المطلوبة لمسار
   */
  static getRequiredPermissions(path: string): Permission | Permission[] | undefined {
    const route = this.getRouteByPath(path);
    return route?.requiredPermission;
  }

  /**
   * إنشاء رابط مع معاملات
   */
  static buildPath(template: string, params: Record<string, string>): string {
    let path = template;
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
    return path;
  }

  /**
   * استخراج معاملات المسار
   */
  static extractParams(template: string, actualPath: string): Record<string, string> {
    const templateParts = template.split('/');
    const actualParts = actualPath.split('/');
    const params: Record<string, string> = {};

    templateParts.forEach((part, index) => {
      if (part.startsWith(':') && actualParts[index]) {
        const paramName = part.substring(1);
        params[paramName] = actualParts[index];
      }
    });

    return params;
  }

  /**
   * التحقق من تطابق المسار مع القالب
   */
  static matchesTemplate(template: string, actualPath: string): boolean {
    const templateParts = template.split('/');
    const actualParts = actualPath.split('/');

    if (templateParts.length !== actualParts.length) {
      return false;
    }

    return templateParts.every((part, index) => {
      return part.startsWith(':') || part === actualParts[index];
    });
  }
}

// تصدير ثوابت الملاحة
export const NAVIGATION_ITEMS = PROTECTED_ROUTES
  .filter(route => route.visible === true)
  .reduce((acc, route) => {
    const category = route.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(route);
    return acc;
  }, {} as Record<string, RouteConfig[]>);
