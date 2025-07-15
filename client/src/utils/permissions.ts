import { Permission, UserProfile } from '../types/permissions';

// 🔐 دوال التحقق من الصلاحيات
// ===============================

/**
 * التحقق من وجود صلاحية واحدة للمستخدم
 * @param userProfile ملف المستخدم الشخصي
 * @param permission الصلاحية المطلوبة
 * @returns true إذا كان المستخدم يملك الصلاحية
 */
export const hasPermission = (
  userProfile: UserProfile | null,
  permission: Permission
): boolean => {
  if (!userProfile) return false;
  
  // المدير لديه جميع الصلاحيات
  if (userProfile.role === 'admin') return true;
  
  // التحقق من وجود الصلاحية في قائمة صلاحيات المستخدم
  return userProfile.permissions.includes(permission);
};

/**
 * التحقق من وجود أي من الصلاحيات المحددة
 * @param userProfile ملف المستخدم الشخصي
 * @param permissions قائمة الصلاحيات المطلوبة (يكفي واحدة منها)
 * @returns true إذا كان المستخدم يملك أي من الصلاحيات
 */
export const hasAnyPermission = (
  userProfile: UserProfile | null,
  permissions: Permission[]
): boolean => {
  if (!userProfile) return false;
  
  // المدير لديه جميع الصلاحيات
  if (userProfile.role === 'admin') return true;
  
  // التحقق من وجود أي من الصلاحيات
  return permissions.some(permission => 
    userProfile.permissions.includes(permission)
  );
};

/**
 * التحقق من وجود جميع الصلاحيات المحددة
 * @param userProfile ملف المستخدم الشخصي
 * @param permissions قائمة الصلاحيات المطلوبة (يجب توفر جميعها)
 * @returns true إذا كان المستخدم يملك جميع الصلاحيات
 */
export const hasAllPermissions = (
  userProfile: UserProfile | null,
  permissions: Permission[]
): boolean => {
  if (!userProfile) return false;
  
  // المدير لديه جميع الصلاحيات
  if (userProfile.role === 'admin') return true;
  
  // التحقق من وجود جميع الصلاحيات
  return permissions.every(permission => 
    userProfile.permissions.includes(permission)
  );
};

/**
 * التحقق من كون المستخدم مدير
 * @param userProfile ملف المستخدم الشخصي
 * @returns true إذا كان المستخدم مدير
 */
export const isAdmin = (userProfile: UserProfile | null): boolean => {
  return userProfile?.role === 'admin';
};

/**
 * التحقق من كون المستخدم مستخدم عادي
 * @param userProfile ملف المستخدم الشخصي
 * @returns true إذا كان المستخدم عادي
 */
export const isUser = (userProfile: UserProfile | null): boolean => {
  return userProfile?.role === 'user';
};

/**
 * الحصول على قائمة الصلاحيات المفقودة
 * @param userProfile ملف المستخدم الشخصي
 * @param requiredPermissions الصلاحيات المطلوبة
 * @returns قائمة الصلاحيات التي لا يملكها المستخدم
 */
export const getMissingPermissions = (
  userProfile: UserProfile | null,
  requiredPermissions: Permission[]
): Permission[] => {
  if (!userProfile) return requiredPermissions;
  
  // المدير لديه جميع الصلاحيات
  if (userProfile.role === 'admin') return [];
  
  return requiredPermissions.filter(permission => 
    !userProfile.permissions.includes(permission)
  );
};

/**
 * فلترة قائمة العناصر بناءً على الصلاحيات
 * @param items قائمة العناصر
 * @param userProfile ملف المستخدم الشخصي
 * @param getRequiredPermission دالة للحصول على الصلاحية المطلوبة لكل عنصر
 * @returns قائمة العناصر المفلترة
 */
export const filterByPermissions = <T>(
  items: T[],
  userProfile: UserProfile | null,
  getRequiredPermission: (item: T) => Permission | Permission[] | null
): T[] => {
  if (!userProfile) return [];
  
  // المدير يرى جميع العناصر
  if (userProfile.role === 'admin') return items;
  
  return items.filter(item => {
    const required = getRequiredPermission(item);
    
    if (!required) return true; // إذا لم تكن هناك صلاحية مطلوبة
    
    if (Array.isArray(required)) {
      return hasAnyPermission(userProfile, required);
    } else {
      return hasPermission(userProfile, required);
    }
  });
};

/**
 * التحقق من الصلاحية مع إمكانية تمرير عدة صلاحيات
 * @param userProfile ملف المستخدم الشخصي
 * @param permissions صلاحية واحدة أو قائمة صلاحيات
 * @param requireAll هل يجب توفر جميع الصلاحيات (افتراضي: false)
 * @returns true إذا كانت الصلاحيات متوفرة
 */
export const checkPermissions = (
  userProfile: UserProfile | null,
  permissions: Permission | Permission[],
  requireAll: boolean = false
): boolean => {
  if (!userProfile) return false;
  
  // المدير لديه جميع الصلاحيات
  if (userProfile.role === 'admin') return true;
  
  if (Array.isArray(permissions)) {
    return requireAll 
      ? hasAllPermissions(userProfile, permissions)
      : hasAnyPermission(userProfile, permissions);
  } else {
    return hasPermission(userProfile, permissions);
  }
};

/**
 * Hook مخصص للتحقق من الصلاحية
 * @param permission الصلاحية المطلوبة
 * @param userProfile ملف المستخدم الشخصي
 * @returns كائن يحتوي على معلومات الصلاحية
 */
export const usePermissionCheck = (
  permission: Permission | Permission[],
  userProfile: UserProfile | null
) => {
  const hasAccess = checkPermissions(userProfile, permission);
  const isLoading = userProfile === null;
  const missingPermissions = Array.isArray(permission) 
    ? getMissingPermissions(userProfile, permission)
    : hasAccess ? [] : [permission];
  
  return {
    hasAccess,
    isLoading,
    missingPermissions,
    isAdmin: isAdmin(userProfile),
    isUser: isUser(userProfile)
  };
};

/**
 * دالة مساعدة لإنشاء دالة فحص صلاحية مخصصة
 * @param permissions الصلاحيات المطلوبة
 * @param requireAll هل يجب توفر جميع الصلاحيات
 * @returns دالة فحص الصلاحية
 */
export const createPermissionChecker = (
  permissions: Permission | Permission[],
  requireAll: boolean = false
) => {
  return (userProfile: UserProfile | null): boolean => {
    return checkPermissions(userProfile, permissions, requireAll);
  };
};

// دوال مساعدة للصلاحيات الشائعة
export const canViewDashboard = createPermissionChecker('view_dashboard');
export const canManageUsers = createPermissionChecker('manage_users');
export const canManageProjects = createPermissionChecker(['create_project', 'edit_project', 'delete_project']);
export const canManageTransactions = createPermissionChecker(['create_transaction', 'edit_transaction', 'delete_transaction']);
export const canManageDocuments = createPermissionChecker(['upload_document', 'edit_document', 'delete_document']);
export const canViewReports = createPermissionChecker('view_reports');
export const canManageSystem = createPermissionChecker(['manage_system', 'edit_settings']);
