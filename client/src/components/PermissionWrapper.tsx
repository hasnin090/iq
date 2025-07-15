import React, { ReactNode } from 'react';
import { Permission, UserProfile } from '../types/permissions';
import { usePermissionCheck } from '../utils/permissions';

// 🎯 مكونات تغليف العناصر بالصلاحيات
// ===================================

interface PermissionWrapperProps {
  permission: Permission | Permission[];
  requireAll?: boolean;
  userProfile: UserProfile | null;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
  className?: string;
  wrapperTag?: keyof JSX.IntrinsicElements;
}

/**
 * مكون تغليف الصلاحيات الأساسي
 */
export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  permission,
  requireAll = false,
  userProfile,
  children,
  fallback = null,
  showFallback = false,
  className = '',
  wrapperTag: Tag = 'div'
}) => {
  const { hasAccess } = usePermissionCheck(permission, userProfile);

  if (!hasAccess) {
    if (showFallback && fallback) {
      return <Tag className={className}>{fallback}</Tag>;
    }
    return null;
  }

  return <Tag className={className}>{children}</Tag>;
};

interface AdminOnlyProps {
  userProfile: UserProfile | null;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * مكون خاص بالمديرين فقط
 */
export const AdminOnly: React.FC<AdminOnlyProps> = ({
  userProfile,
  children,
  fallback = null,
  showFallback = false
}) => {
  if (!userProfile || userProfile.role !== 'admin') {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

interface UserOnlyProps {
  userProfile: UserProfile | null;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * مكون خاص بالمستخدمين العاديين فقط
 */
export const UserOnly: React.FC<UserOnlyProps> = ({
  userProfile,
  children,
  fallback = null,
  showFallback = false
}) => {
  if (!userProfile || userProfile.role !== 'user') {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

interface ManagerOnlyProps {
  userProfile: UserProfile | null;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * مكون خاص بالمديرين فقط
 */
export const ManagerOnly: React.FC<ManagerOnlyProps> = ({
  userProfile,
  children,
  fallback = null,
  showFallback = false
}) => {
  if (!userProfile || userProfile.role !== 'manager') {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

interface ViewerOnlyProps {
  userProfile: UserProfile | null;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * مكون خاص بالمشاهدين فقط
 */
export const ViewerOnly: React.FC<ViewerOnlyProps> = ({
  userProfile,
  children,
  fallback = null,
  showFallback = false
}) => {
  if (!userProfile || userProfile.role !== 'viewer') {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

interface ProjectMemberOnlyProps {
  userProfile: UserProfile | null;
  projectId: string;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * مكون خاص بأعضاء مشروع محدد
 */
export const ProjectMemberOnly: React.FC<ProjectMemberOnlyProps> = ({
  userProfile,
  projectId,
  children,
  fallback = null,
  showFallback = false
}) => {
  if (!userProfile) {
    return showFallback ? <>{fallback}</> : null;
  }

  // المدير والمدير العام يمكنهما الوصول إلى جميع المشاريع
  if (userProfile.role === 'admin' || userProfile.role === 'manager') {
    return <>{children}</>;
  }

  // التحقق من عضوية المستخدم في المشروع
  const isMember = userProfile.projects?.some(p => p.project_id === projectId) || 
                   userProfile.project_ids?.includes(projectId);
  
  if (!isMember) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

interface PermissionListProps {
  permissions: Permission[];
  userProfile: UserProfile | null;
  renderItem: (permission: Permission, hasAccess: boolean, index: number) => ReactNode;
  showOnlyAllowed?: boolean;
  className?: string;
}

/**
 * مكون عرض قائمة العناصر بناءً على الصلاحيات
 */
export const PermissionList: React.FC<PermissionListProps> = ({
  permissions,
  userProfile,
  renderItem,
  showOnlyAllowed = false,
  className = ''
}) => {
  const items = permissions.map((permission, index) => {
    const { hasAccess } = usePermissionCheck(permission, userProfile);
    
    if (showOnlyAllowed && !hasAccess) {
      return null;
    }
    
    return (
      <React.Fragment key={`${permission}-${index}`}>
        {renderItem(permission, hasAccess, index)}
      </React.Fragment>
    );
  }).filter(Boolean);

  return <div className={className}>{items}</div>;
};

interface PermissionTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    permission?: Permission | Permission[];
    requireAll?: boolean;
    content: ReactNode;
  }>;
  userProfile: UserProfile | null;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  tabClassName?: string;
  contentClassName?: string;
}

/**
 * مكون التبويبات المحمية بالصلاحيات
 */
export const PermissionTabs: React.FC<PermissionTabsProps> = ({
  tabs,
  userProfile,
  activeTab,
  onTabChange,
  className = '',
  tabClassName = '',
  contentClassName = ''
}) => {
  // فلترة التبويبات المسموحة
  const allowedTabs = tabs.filter(tab => {
    if (!tab.permission) return true;
    const { hasAccess } = usePermissionCheck(tab.permission, userProfile);
    return hasAccess;
  });

  // التأكد من أن التبويب النشط مسموح
  const currentTab = allowedTabs.find(tab => tab.id === activeTab) || allowedTabs[0];

  if (!currentTab) {
    return (
      <div className="text-center py-8 text-gray-500">
        لا توجد تبويبات متاحة
      </div>
    );
  }

  return (
    <div className={className}>
      {/* شريط التبويبات */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {allowedTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${
                  currentTab.id === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                ${tabClassName}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* محتوى التبويب */}
      <div className={`mt-4 ${contentClassName}`}>
        {currentTab.content}
      </div>
    </div>
  );
};

interface PermissionMenuProps {
  items: Array<{
    id: string;
    label: string;
    icon?: ReactNode;
    permission?: Permission | Permission[];
    requireAll?: boolean;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
  }>;
  userProfile: UserProfile | null;
  className?: string;
  itemClassName?: string;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * مكون القائمة المحمية بالصلاحيات
 */
export const PermissionMenu: React.FC<PermissionMenuProps> = ({
  items,
  userProfile,
  className = '',
  itemClassName = '',
  orientation = 'vertical'
}) => {
  const allowedItems = items.filter(item => {
    if (!item.permission) return true;
    const { hasAccess } = usePermissionCheck(item.permission, userProfile);
    return hasAccess;
  });

  const baseItemClass = `
    flex items-center px-4 py-2 text-sm font-medium rounded-md
    transition-colors duration-200
    ${orientation === 'horizontal' ? 'mr-2' : 'mb-1'}
  `;

  const containerClass = `
    ${orientation === 'horizontal' ? 'flex flex-row' : 'flex flex-col'}
    ${className}
  `;

  return (
    <div className={containerClass}>
      {allowedItems.map((item) => {
        const isDisabled = item.disabled;
        const itemClass = `
          ${baseItemClass}
          ${isDisabled 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer'
          }
          ${itemClassName}
        `;

        if (item.href && !isDisabled) {
          return (
            <a
              key={item.id}
              href={item.href}
              className={itemClass}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </a>
          );
        }

        return (
          <button
            key={item.id}
            onClick={!isDisabled ? item.onClick : undefined}
            disabled={isDisabled}
            className={itemClass}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

interface PermissionCardProps {
  permission: Permission | Permission[];
  requireAll?: boolean;
  userProfile: UserProfile | null;
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  showLock?: boolean;
}

/**
 * مكون البطاقة المحمية بالصلاحيات
 */
export const PermissionCard: React.FC<PermissionCardProps> = ({
  permission,
  requireAll = false,
  userProfile,
  children,
  title,
  description,
  className = '',
  showLock = true
}) => {
  const { hasAccess } = usePermissionCheck(permission, userProfile);

  if (!hasAccess) {
    return (
      <div className={`
        bg-gray-50 border border-gray-200 rounded-lg p-6 text-center
        ${className}
      `}>
        {showLock && (
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        )}
        <h3 className="text-lg font-medium text-gray-500 mb-2">
          {title || 'محتوى محمي'}
        </h3>
        <p className="text-gray-400">
          {description || 'ليس لديك الصلاحية للوصول إلى هذا المحتوى'}
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-gray-600 mb-4">{description}</p>
      )}
      {children}
    </div>
  );
};
