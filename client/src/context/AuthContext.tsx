import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, UserPermissionService } from '../services/userPermissionService';
import { UserProfile, Permission } from '../types/permissions';

// 🔄 سياق إدارة المستخدم والصلاحيات
// =====================================

interface AuthContextType {
  user: any | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccessProject: (projectId: string) => boolean;
  updateUserRole: (userId: string, role: 'admin' | 'manager' | 'user' | 'viewer') => Promise<boolean>;
  addUserToProject: (userId: string, projectId: string, roleInProject?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// مزود السياق
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // تحديد حالة التحميل الأولي
  useEffect(() => {
    // الحصول على الجلسة الحالية
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('خطأ في تهيئة المصادقة:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // الاستماع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('تغيير حالة المصادقة:', event);
        
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // تحميل ملف المستخدم
  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await UserPermissionService.getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('خطأ في تحميل ملف المستخدم:', error);
      setUserProfile(null);
    }
  };

  // تسجيل الدخول
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: getArabicErrorMessage(error.message) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'حدث خطأ غير متوقع' };
    }
  };

  // إنشاء حساب جديد
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        return { success: false, error: getArabicErrorMessage(error.message) };
      }

      // إنشاء ملف المستخدم في قاعدة البيانات
      if (data.user) {
        await UserPermissionService.createUserProfile(
          data.user.id,
          fullName,
          'user' // الدور الافتراضي
        );
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'حدث خطأ غير متوقع' };
    }
  };

  // تسجيل الخروج
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  // تحديث ملف المستخدم
  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  // فحص الصلاحيات
  const hasPermission = (permission: Permission): boolean => {
    return UserPermissionService.hasPermission(userProfile, permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!userProfile) return false;
    if (userProfile.role === 'admin') return true;
    return permissions.some(permission => userProfile.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!userProfile) return false;
    if (userProfile.role === 'admin') return true;
    return permissions.every(permission => userProfile.permissions.includes(permission));
  };

  const canAccessProject = (projectId: string): boolean => {
    return UserPermissionService.canAccessProject(userProfile, projectId);
  };

  // تحديث دور المستخدم
  const updateUserRole = async (
    userId: string, 
    role: 'admin' | 'manager' | 'user' | 'viewer'
  ): Promise<boolean> => {
    const success = await UserPermissionService.updateUserRole(userId, role);
    if (success && userId === user?.id) {
      await refreshProfile();
    }
    return success;
  };

  // إضافة المستخدم لمشروع
  const addUserToProject = async (
    userId: string, 
    projectId: string, 
    roleInProject?: string
  ): Promise<boolean> => {
    const success = await UserPermissionService.addUserToProject(userId, projectId, roleInProject);
    if (success && userId === user?.id) {
      await refreshProfile();
    }
    return success;
  };

  // قيمة السياق
  const contextValue: AuthContextType = {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessProject,
    updateUserRole,
    addUserToProject
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook لاستخدام السياق
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth يجب أن يُستخدم داخل AuthProvider');
  }
  return context;
};

// Hook للتحقق من صلاحية محددة
export const usePermission = (permission: Permission) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

// Hook للتحقق من إمكانية الوصول لمشروع
export const useProjectAccess = (projectId: string) => {
  const { canAccessProject } = useAuth();
  return canAccessProject(projectId);
};

// Hook لحماية العمليات
export const useProtectedAction = (permission: Permission | Permission[]) => {
  const { hasPermission, hasAnyPermission } = useAuth();
  
  const executeAction = (
    action: () => void,
    options?: {
      requireAll?: boolean;
      onUnauthorized?: () => void;
      unauthorizedMessage?: string;
    }
  ) => {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasAccess = options?.requireAll 
      ? permissions.every(p => hasPermission(p))
      : hasAnyPermission(permissions);

    if (hasAccess) {
      action();
    } else {
      if (options?.onUnauthorized) {
        options.onUnauthorized();
      } else {
        alert(options?.unauthorizedMessage || 'ليس لديك صلاحية لتنفيذ هذا الإجراء');
      }
    }
  };

  return { executeAction };
};

// دالة مساعدة لترجمة رسائل الخطأ
const getArabicErrorMessage = (errorMessage: string): string => {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'بيانات تسجيل الدخول غير صحيحة',
    'Email not confirmed': 'البريد الإلكتروني غير مؤكد',
    'Password should be at least 6 characters': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    'Email already registered': 'البريد الإلكتروني مسجل مسبقاً',
    'Invalid email': 'البريد الإلكتروني غير صحيح',
    'Weak password': 'كلمة المرور ضعيفة',
    'Network error': 'خطأ في الشبكة',
    'Too many requests': 'عدد كبير من المحاولات'
  };

  return errorMap[errorMessage] || 'حدث خطأ غير متوقع';
};

// مكون حماية الطرق
interface ProtectedRouteWrapperProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'manager' | 'user' | 'viewer';
  requiredPermission?: Permission | Permission[];
  fallback?: ReactNode;
}

export const ProtectedRouteWrapper: React.FC<ProtectedRouteWrapperProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback
}) => {
  const { userProfile, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            يرجى تسجيل الدخول
          </h3>
          <p className="text-gray-600 mb-6">
            تحتاج إلى تسجيل الدخول للوصول إلى هذه الصفحة
          </p>
        </div>
      </div>
    );
  }

  // التحقق من الدور المطلوب
  if (requiredRole && userProfile?.role !== requiredRole && userProfile?.role !== 'admin') {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            غير مصرح بالوصول
          </h3>
          <p className="text-gray-600 mb-6">
            ليس لديك الدور المطلوب للوصول إلى هذه الصفحة
          </p>
        </div>
      </div>
    );
  }

  // التحقق من الصلاحية المطلوبة
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    const hasAccess = UserPermissionService.hasPermission(userProfile, permissions[0]) ||
                      (userProfile?.role === 'admin');

    if (!hasAccess) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              غير مصرح بالوصول
            </h3>
            <p className="text-gray-600 mb-6">
              ليس لديك الصلاحية المطلوبة للوصول إلى هذه الصفحة
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
