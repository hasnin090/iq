/**
 * نظام المحاسبة المتقدم - إدارة API
 * Arabic Accounting System - API Management
 */

// ====================================
// إعدادات API
// ====================================
const API_BASE_URL = '/api';
const API_TIMEOUT = 30000; // 30 ثانية

// ====================================
// دالة API الرئيسية
// ====================================
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include'
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
        
        finalOptions.signal = controller.signal;
        
        const response = await fetch(url, finalOptions);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('انتهت مهلة الطلب');
        }
        throw error;
    }
}

// ====================================
// دوال المصادقة
// ====================================
const authAPI = {
    async login(credentials) {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        return await response.json();
    },
    
    async logout() {
        const response = await apiRequest('/auth/logout', {
            method: 'POST'
        });
        return await response.json();
    },
    
    async getSession() {
        const response = await apiRequest('/auth/session');
        return await response.json();
    },
    
    async changePassword(passwordData) {
        const response = await apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(passwordData)
        });
        return await response.json();
    }
};

// ====================================
// دوال المعاملات
// ====================================
const transactionsAPI = {
    async getAll(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await apiRequest(`/transactions?${params}`);
        return await response.json();
    },
    
    async getById(id) {
        const response = await apiRequest(`/transactions/${id}`);
        return await response.json();
    },
    
    async create(transactionData) {
        const response = await apiRequest('/transactions', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
        return await response.json();
    },
    
    async update(id, transactionData) {
        const response = await apiRequest(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(transactionData)
        });
        return await response.json();
    },
    
    async delete(id) {
        const response = await apiRequest(`/transactions/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    },
    
    async uploadFile(transactionId, file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await apiRequest(`/transactions/${transactionId}/upload`, {
            method: 'POST',
            headers: {}, // إزالة Content-Type للسماح بـ multipart/form-data
            body: formData
        });
        return await response.json();
    }
};

// ====================================
// دوال المشاريع
// ====================================
const projectsAPI = {
    async getAll() {
        const response = await apiRequest('/projects');
        return await response.json();
    },
    
    async getById(id) {
        const response = await apiRequest(`/projects/${id}`);
        return await response.json();
    },
    
    async create(projectData) {
        const response = await apiRequest('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
        return await response.json();
    },
    
    async update(id, projectData) {
        const response = await apiRequest(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
        return await response.json();
    },
    
    async delete(id) {
        const response = await apiRequest(`/projects/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    },
    
    async getTransactions(projectId, filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await apiRequest(`/projects/${projectId}/transactions?${params}`);
        return await response.json();
    }
};

// ====================================
// دوال المستخدمين
// ====================================
const usersAPI = {
    async getAll() {
        const response = await apiRequest('/users');
        return await response.json();
    },
    
    async getById(id) {
        const response = await apiRequest(`/users/${id}`);
        return await response.json();
    },
    
    async create(userData) {
        const response = await apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        return await response.json();
    },
    
    async update(id, userData) {
        const response = await apiRequest(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        return await response.json();
    },
    
    async delete(id) {
        const response = await apiRequest(`/users/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    },
    
    async updatePermissions(id, permissions) {
        const response = await apiRequest(`/users/${id}/permissions`, {
            method: 'PUT',
            body: JSON.stringify({ permissions })
        });
        return await response.json();
    }
};

// ====================================
// دوال المستندات
// ====================================
const documentsAPI = {
    async getAll(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await apiRequest(`/documents?${params}`);
        return await response.json();
    },
    
    async getById(id) {
        const response = await apiRequest(`/documents/${id}`);
        return await response.json();
    },
    
    async create(documentData) {
        const response = await apiRequest('/documents', {
            method: 'POST',
            body: JSON.stringify(documentData)
        });
        return await response.json();
    },
    
    async upload(file, metadata) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify(metadata));
        
        const response = await apiRequest('/documents/upload', {
            method: 'POST',
            headers: {},
            body: formData
        });
        return await response.json();
    },
    
    async delete(id) {
        const response = await apiRequest(`/documents/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    }
};

// ====================================
// دوال التقارير
// ====================================
const reportsAPI = {
    async getDashboard(dateRange = {}) {
        const params = new URLSearchParams(dateRange);
        const response = await apiRequest(`/dashboard?${params}`);
        return await response.json();
    },
    
    async getFinancialReport(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await apiRequest(`/reports/financial?${params}`);
        return await response.json();
    },
    
    async getProjectReport(projectId, filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await apiRequest(`/reports/projects/${projectId}?${params}`);
        return await response.json();
    },
    
    async exportPDF(reportType, filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await apiRequest(`/reports/${reportType}/pdf?${params}`);
        return response.blob();
    },
    
    async exportExcel(reportType, filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await apiRequest(`/reports/${reportType}/excel?${params}`);
        return response.blob();
    }
};

// ====================================
// دوال الإعدادات
// ====================================
const settingsAPI = {
    async getAll() {
        const response = await apiRequest('/settings');
        return await response.json();
    },
    
    async update(key, value) {
        const response = await apiRequest('/settings', {
            method: 'PUT',
            body: JSON.stringify({ key, value })
        });
        return await response.json();
    },
    
    async createBackup() {
        const response = await apiRequest('/backup/create', {
            method: 'POST'
        });
        return await response.json();
    },
    
    async restoreBackup(backupData) {
        const response = await apiRequest('/backup/restore', {
            method: 'POST',
            body: JSON.stringify(backupData)
        });
        return await response.json();
    }
};

// ====================================
// دوال النشاطات
// ====================================
const activitiesAPI = {
    async getAll(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await apiRequest(`/activity-logs?${params}`);
        return await response.json();
    },
    
    async getByUser(userId, filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await apiRequest(`/activity-logs/user/${userId}?${params}`);
        return await response.json();
    }
};

// ====================================
// دوال حالة النظام
// ====================================
const systemAPI = {
    async getStatus() {
        const response = await apiRequest('/database/status');
        return await response.json();
    },
    
    async getHealth() {
        const response = await apiRequest('/health');
        return await response.json();
    }
};

// ====================================
// دالة التعامل مع أخطاء API
// ====================================
function handleAPIError(error, context = '') {
    console.error(`خطأ API ${context}:`, error);
    
    if (error.message.includes('401')) {
        // إعادة توجيه لتسجيل الدخول
        window.location.href = '/login';
        return;
    }
    
    if (error.message.includes('403')) {
        showErrorMessage('ليس لديك صلاحية للوصول لهذا المورد');
        return;
    }
    
    if (error.message.includes('404')) {
        showErrorMessage('المورد المطلوب غير موجود');
        return;
    }
    
    if (error.message.includes('500')) {
        showErrorMessage('خطأ في الخادم، يرجى المحاولة لاحقاً');
        return;
    }
    
    showErrorMessage(error.message || 'حدث خطأ غير متوقع');
}

// ====================================
// تصدير APIs للاستخدام العام
// ====================================
window.API = {
    auth: authAPI,
    transactions: transactionsAPI,
    projects: projectsAPI,
    users: usersAPI,
    documents: documentsAPI,
    reports: reportsAPI,
    settings: settingsAPI,
    activities: activitiesAPI,
    system: systemAPI,
    handleError: handleAPIError,
    request: apiRequest
};