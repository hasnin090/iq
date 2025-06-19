import { usePermissions } from '@/hooks/use-permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  permission,
  permissions = [],
  role,
  roles = [],
  requireAll = false,
  fallback,
  children
}: PermissionGuardProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole
  } = usePermissions();

  let hasAccess = true;

  // فحص الصلاحية المفردة
  if (permission) {
    hasAccess = hasPermission(permission);
  }

  // فحص الصلاحيات المتعددة
  if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  // فحص الدور المفرد
  if (role) {
    hasAccess = hasAccess && hasRole(role);
  }

  // فحص الأدوار المتعددة
  if (roles.length > 0) {
    hasAccess = hasAccess && hasAnyRole(roles);
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert className="border-red-200 bg-red-50">
        <Shield className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-700">
          ليس لديك صلاحية للوصول إلى هذا المحتوى
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

// مكونات مساعدة للاستخدام السريع
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard role="admin" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function ManagerOrAdmin({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard roles={["admin", "manager"]} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function UserOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard role="user" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function ViewerRestricted({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard roles={["admin", "manager", "user"]} fallback={null}>
      {children}
    </PermissionGuard>
  );
}