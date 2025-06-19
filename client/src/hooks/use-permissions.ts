import { useAuth } from './use-auth';

interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  role: string;
  permissions: string[];
}

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user?.permissions) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user?.permissions) return false;
    return permissions.every(permission => user.permissions.includes(permission));
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const isManager = (): boolean => {
    return hasRole('manager');
  };

  const isUser = (): boolean => {
    return hasRole('user');
  };

  const isViewer = (): boolean => {
    return hasRole('viewer');
  };

  // صلاحيات محددة للوظائف
  const canManageUsers = (): boolean => {
    return hasPermission('manage_users');
  };

  const canViewUsers = (): boolean => {
    return hasPermission('view_users');
  };

  const canManageProjects = (): boolean => {
    return hasPermission('manage_projects');
  };

  const canManageTransactions = (): boolean => {
    return hasPermission('manage_transactions');
  };

  const canViewTransactions = (): boolean => {
    return hasPermission('view_transactions');
  };

  const canManageDocuments = (): boolean => {
    return hasPermission('manage_documents');
  };

  const canViewReports = (): boolean => {
    return hasPermission('view_reports');
  };

  const canManageSettings = (): boolean => {
    return hasPermission('manage_settings');
  };

  const canViewActivityLogs = (): boolean => {
    return hasPermission('view_activity_logs');
  };

  // فحص الصلاحيات المالية
  const canViewIncome = (): boolean => {
    return hasPermission('view_income');
  };

  const canManageProjectTransactions = (): boolean => {
    return hasPermission('manage_project_transactions');
  };

  return {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    isUser,
    isViewer,
    canManageUsers,
    canViewUsers,
    canManageProjects,
    canManageTransactions,
    canViewTransactions,
    canManageDocuments,
    canViewReports,
    canManageSettings,
    canViewActivityLogs,
    canViewIncome,
    canManageProjectTransactions,
  };
}