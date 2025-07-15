import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PermissionWrapper, AdminOnly, ManagerOnly, UserOnly, ViewerOnly } from '../components/PermissionWrapper';
import { Permission } from '../types/permissions';

// 🎨 مكونات واجهة المستخدم الجاهزة
// ===================================

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  permission?: Permission;
  className?: string;
  onClick?: () => void;
}

/**
 * بطاقة لوحة التحكم مع حماية بالصلاحيات
 */
export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  description,
  permission,
  className = '',
  onClick
}) => {
  const { userProfile } = useAuth();

  const CardContent = (
    <div 
      className={`
        bg-white overflow-hidden shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 text-blue-600">
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="text-lg font-medium text-gray-900">
              {value}
            </dd>
            {description && (
              <dd className="text-sm text-gray-600 mt-1">
                {description}
              </dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  );

  if (permission) {
    return (
      <PermissionWrapper permission={permission} userProfile={userProfile}>
        {CardContent}
      </PermissionWrapper>
    );
  }

  return CardContent;
};

interface ActionButtonProps {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  permission?: Permission | Permission[];
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * زر عمل محمي بالصلاحيات
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon,
  onClick,
  permission,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = ''
}) => {
  const { userProfile, hasPermission, hasAnyPermission } = useAuth();

  // التحقق من الصلاحية
  const hasAccess = permission 
    ? Array.isArray(permission) 
      ? hasAnyPermission(permission)
      : hasPermission(permission)
    : true;

  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-md
    focus:outline-none focus:ring-2 focus:ring-offset-2
    transition-colors duration-200
    ${disabled || !hasAccess ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}
  `;

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const handleClick = () => {
    if (!disabled && hasAccess && !loading) {
      onClick();
    } else if (!hasAccess) {
      alert('ليس لديك صلاحية لتنفيذ هذا الإجراء');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !hasAccess || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon && (
        <span className="mr-2">{icon}</span>
      )}
      {label}
    </button>
  );
};

interface NavigationMenuProps {
  items: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    href?: string;
    onClick?: () => void;
    permission?: Permission;
    role?: 'admin' | 'manager' | 'user' | 'viewer';
    children?: Array<{
      id: string;
      label: string;
      href?: string;
      onClick?: () => void;
      permission?: Permission;
    }>;
  }>;
  className?: string;
}

/**
 * قائمة تنقل محمية بالصلاحيات
 */
export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  items,
  className = ''
}) => {
  const { userProfile } = useAuth();

  const renderMenuItem = (item: any) => {
    const MenuItemContent = (
      <div key={item.id}>
        {item.href ? (
          <a
            href={item.href}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            {item.icon && <span className="mr-3">{item.icon}</span>}
            {item.label}
          </a>
        ) : (
          <button
            onClick={item.onClick}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-right"
          >
            {item.icon && <span className="mr-3">{item.icon}</span>}
            {item.label}
          </button>
        )}
        
        {item.children && (
          <div className="mr-6">
            {item.children.map((child: any) => (
              <PermissionWrapper 
                key={child.id}
                permission={child.permission || 'view_dashboard'}
                userProfile={userProfile}
              >
                {child.href ? (
                  <a
                    href={child.href}
                    className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    {child.label}
                  </a>
                ) : (
                  <button
                    onClick={child.onClick}
                    className="w-full text-right block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    {child.label}
                  </button>
                )}
              </PermissionWrapper>
            ))}
          </div>
        )}
      </div>
    );

    // تطبيق حماية الصلاحيات أو الأدوار
    if (item.role) {
      switch (item.role) {
        case 'admin':
          return <AdminOnly key={item.id} userProfile={userProfile}>{MenuItemContent}</AdminOnly>;
        case 'manager':
          return <ManagerOnly key={item.id} userProfile={userProfile}>{MenuItemContent}</ManagerOnly>;
        case 'user':
          return <UserOnly key={item.id} userProfile={userProfile}>{MenuItemContent}</UserOnly>;
        case 'viewer':
          return <ViewerOnly key={item.id} userProfile={userProfile}>{MenuItemContent}</ViewerOnly>;
        default:
          return MenuItemContent;
      }
    }

    if (item.permission) {
      return (
        <PermissionWrapper key={item.id} permission={item.permission} userProfile={userProfile}>
          {MenuItemContent}
        </PermissionWrapper>
      );
    }

    return MenuItemContent;
  };

  return (
    <nav className={`bg-white shadow ${className}`}>
      <div className="space-y-1">
        {items.map(renderMenuItem)}
      </div>
    </nav>
  );
};

interface UserRoleBadgeProps {
  userProfile: any;
  className?: string;
}

/**
 * شارة دور المستخدم
 */
export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ 
  userProfile, 
  className = '' 
}) => {
  if (!userProfile) return null;

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
    user: 'bg-green-100 text-green-800',
    viewer: 'bg-gray-100 text-gray-800'
  };

  const roleLabels = {
    admin: 'مدير عام',
    manager: 'مدير',
    user: 'مستخدم',
    viewer: 'مشاهد'
  };

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${roleColors[userProfile.role] || roleColors.viewer}
      ${className}
    `}>
      {roleLabels[userProfile.role] || 'غير محدد'}
    </span>
  );
};

interface PermissionListDisplayProps {
  permissions: Permission[];
  userProfile: any;
  showMissing?: boolean;
  className?: string;
}

/**
 * عرض قائمة الصلاحيات
 */
export const PermissionListDisplay: React.FC<PermissionListDisplayProps> = ({
  permissions,
  userProfile,
  showMissing = false,
  className = ''
}) => {
  const { hasPermission } = useAuth();

  return (
    <div className={`space-y-2 ${className}`}>
      {permissions.map(permission => {
        const hasAccess = hasPermission(permission);
        
        if (!showMissing && !hasAccess) return null;

        return (
          <div
            key={permission}
            className={`
              flex items-center justify-between p-2 rounded
              ${hasAccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}
            `}
          >
            <span className="text-sm">{permission}</span>
            <span className="text-xs">
              {hasAccess ? '✓' : '✗'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * مؤشر التحميل
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]} ${className}`}></div>
  );
};
