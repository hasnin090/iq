// أنواع البيانات المشتركة للتطبيق

// نوع المستند
export interface Document {
  id: number;
  name: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  projectId?: number;
  transactionId?: number;
  uploadDate: string;
  uploadedBy: number;
  isManagerDocument?: boolean;
}

// نوع المشروع
export interface Project {
  id: number;
  name: string;
  description?: string;
  budget: number;
  status: 'active' | 'completed' | 'on-hold';
  startDate: string;
  endDate?: string;
  clientId?: number;
  managerId: number;
}

// نوع المستخدم
export interface User {
  id: number;
  username: string;
  fullname: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  department?: string;
  permissions?: string[];
}

// نوع المعاملة المالية
export interface Transaction {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description?: string;
  projectId?: number;
  fileUrl?: string;
  fileType?: string;
}

// نوع التقرير
export interface Report {
  id: number;
  name: string;
  type: 'financial' | 'project' | 'user';
  dateRange: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
  createdAt: string;
  createdBy: number;
}

// نوع الإشعار
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  createdAt: string;
  read: boolean;
  userId: number;
}

// نموذج إحصائيات اللوحة الرئيسية
export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  recentTransactions: Transaction[];
  activeProjects: number;
  pendingDocuments: number;
}