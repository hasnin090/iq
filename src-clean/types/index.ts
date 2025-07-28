// أنواع البيانات الأساسية للنظام

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  budget: number;
  spent: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  startDate: string;
  endDate?: string;
  managerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  projectId: number;
  employeeId?: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  receipt?: string;
  approvedBy?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: number;
  name: string;
  position: string;
  salary: number;
  phoneNumber?: string;
  email?: string;
  hireDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseType {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// أنواع API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// أنواع التحليلات والإحصائيات
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  totalEmployees: number;
  totalExpenseTypes: number;
}

// حالة التحميل
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}
