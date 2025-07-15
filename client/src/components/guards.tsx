import React, { ReactNode, useEffect, useState } from 'react';
import { Permission, UserProfile } from '../types/permissions';
import { checkPermissions, usePermissionCheck } from '../utils/permissions';

// 🛡️ مكونات حماية المسارات والواجهات
// ====================================

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: Permission | Permission[];
  requireAll?: boolean;
  userProfile: UserProfile | null;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
  onUnauthorized?: () => void;
}

/**
 * مكون حماية المسارات - يتحقق من الصلاحيات قبل عرض المحتوى
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requireAll = false,
  userProfile,
  fallback,
  loadingComponent,
  onUnauthorized
}) => {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // إعطاء وقت قصير لتحميل بيانات المستخدم
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [userProfile]);

  // إذا كان المستخدم لم يتم تحميله بعد
  if (isChecking || userProfile === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {loadingComponent || (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        )}
      </div>
    );
  }

  // إذا لم تكن هناك صلاحية مطلوبة، اعرض المحتوى
  if (!requiredPermission) {
    return <>{children}</>;
  }

  // التحقق من الصلاحية
  const hasAccess = checkPermissions(userProfile, requiredPermission, requireAll);

  if (!hasAccess) {
    // تنفيذ callback في حالة عدم الترخيص
    if (onUnauthorized) {
      onUnauthorized();
    }

    // عرض المحتوى البديل أو رسالة عدم الترخيص
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {fallback || (
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              غير مصرح بالوصول
            </h3>
            <p className="text-gray-600 mb-6">
              ليس لديك الصلاحية اللازمة للوصول إلى هذه الصفحة. يرجى التواصل مع المدير.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              العودة للخلف
            </button>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

interface PermissionGuardProps {
  permission: Permission | Permission[];
  requireAll?: boolean;
  userProfile: UserProfile | null;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * مكون حماية العناصر - يظهر أو يخفي العناصر بناءً على الصلاحيات
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  requireAll = false,
  userProfile,
  children,
  fallback = null,
  showFallback = false
}) => {
  const { hasAccess } = usePermissionCheck(permission, userProfile);

  if (!hasAccess) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

interface ConditionalRenderProps {
  condition: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * مكون العرض الشرطي - مساعد عام للعرض الشرطي
 */
export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  condition,
  children,
  fallback = null
}) => {
  return condition ? <>{children}</> : <>{fallback}</>;
};

interface RoleBasedRenderProps {
  userProfile: UserProfile | null;
  adminContent?: ReactNode;
  managerContent?: ReactNode;
  userContent?: ReactNode;
  viewerContent?: ReactNode;
  guestContent?: ReactNode;
  fallback?: ReactNode;
}

/**
 * مكون العرض حسب الدور - يعرض محتوى مختلف حسب دور المستخدم
 */
export const RoleBasedRender: React.FC<RoleBasedRenderProps> = ({
  userProfile,
  adminContent,
  managerContent,
  userContent,
  viewerContent,
  guestContent,
  fallback = null
}) => {
  if (!userProfile) {
    return <>{guestContent || fallback}</>;
  }

  switch (userProfile.role) {
    case 'admin':
      return <>{adminContent || fallback}</>;
    case 'manager':
      return <>{managerContent || fallback}</>;
    case 'user':
      return <>{userContent || fallback}</>;
    case 'viewer':
      return <>{viewerContent || fallback}</>;
    default:
      return <>{fallback}</>;
  }
};

interface PermissionButtonProps {
  permission: Permission | Permission[];
  requireAll?: boolean;
  userProfile: UserProfile | null;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
  disabledMessage?: string;
}

/**
 * مكون زر محمي بالصلاحيات
 */
export const PermissionButton: React.FC<PermissionButtonProps> = ({
  permission,
  requireAll = false,
  userProfile,
  onClick,
  className = '',
  children,
  disabled = false,
  disabledMessage = 'ليس لديك صلاحية لهذا الإجراء'
}) => {
  const { hasAccess } = usePermissionCheck(permission, userProfile);
  
  const isDisabled = disabled || !hasAccess;
  
  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    } else if (!hasAccess) {
      alert(disabledMessage);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`${className} ${
        isDisabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:opacity-90 cursor-pointer'
      }`}
      title={!hasAccess ? disabledMessage : undefined}
    >
      {children}
    </button>
  );
};

// Hook مخصص لحماية العمليات
export const useProtectedAction = (
  permission: Permission | Permission[],
  userProfile: UserProfile | null,
  requireAll: boolean = false
) => {
  const { hasAccess } = usePermissionCheck(permission, userProfile);
  
  const executeAction = (action: () => void, onUnauthorized?: () => void) => {
    if (hasAccess) {
      action();
    } else {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        alert('ليس لديك صلاحية لتنفيذ هذا الإجراء');
      }
    }
  };
  
  return {
    hasAccess,
    executeAction
  };
};
