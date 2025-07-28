// خدمة API أساسية للتواصل مع الخادم

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/.netlify/functions'
  : 'http://localhost:5000';

// دالة أساسية لإرسال طلبات HTTP
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

// خدمات API المختلفة
export const apiService = {
  // فحص صحة النظام
  health: () => apiRequest('/api/health'),
  
  // إحصائيات لوحة التحكم
  dashboard: () => apiRequest('/api/dashboard'),
  
  // المشاريع
  projects: {
    getAll: () => apiRequest('/api/projects'),
    getById: (id: number) => apiRequest(`/api/projects/${id}`),
    create: (data: any) => apiRequest('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: any) => apiRequest(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => apiRequest(`/api/projects/${id}`, {
      method: 'DELETE',
    }),
  },
  
  // المعاملات المالية
  transactions: {
    getAll: () => apiRequest('/api/transactions'),
    getById: (id: number) => apiRequest(`/api/transactions/${id}`),
    create: (data: any) => apiRequest('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: any) => apiRequest(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => apiRequest(`/api/transactions/${id}`, {
      method: 'DELETE',
    }),
  },
  
  // الموظفين
  employees: {
    getAll: () => apiRequest('/api/employees'),
    getById: (id: number) => apiRequest(`/api/employees/${id}`),
    create: (data: any) => apiRequest('/api/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: any) => apiRequest(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => apiRequest(`/api/employees/${id}`, {
      method: 'DELETE',
    }),
  },
  
  // أنواع المصروفات
  expenseTypes: {
    getAll: () => apiRequest('/api/expense-types'),
    create: (data: any) => apiRequest('/api/expense-types', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: any) => apiRequest(`/api/expense-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => apiRequest(`/api/expense-types/${id}`, {
      method: 'DELETE',
    }),
  }
};

export default apiService;
