import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './guards';
import { PermissionWrapper } from './PermissionWrapper';
import { ActionButton, DashboardCard } from './ui/PermissionComponents';

// 💰 نظام إدارة المعاملات المالية المتكامل
// =========================================

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  project_id?: string;
  project_name?: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  approved_by?: string;
  reference_number: string;
  attachments: string[];
  created_at: string;
  updated_at: string;
}

interface TransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  project_id?: string;
  date: string;
  reference_number: string;
}

const TRANSACTION_CATEGORIES = {
  income: [
    'دفعة مقدمة',
    'دفعة دورية',
    'دفعة نهائية',
    'استرداد',
    'أخرى'
  ],
  expense: [
    'مواد خام',
    'رواتب',
    'مصاريف إدارية',
    'تسويق',
    'صيانة',
    'مواصلات',
    'أخرى'
  ]
};

// الصفحة الرئيسية للمعاملات
export function TransactionsPage() {
  const { userProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState({
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    project: 'all'
  });

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      // محاكاة بيانات المعاملات
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 25000,
          description: 'دفعة مقدمة مشروع تطوير النظام',
          category: 'دفعة مقدمة',
          project_id: '1',
          project_name: 'تطوير نظام المحاسبة',
          date: '2024-03-01',
          status: 'approved',
          created_by: '2',
          approved_by: '1',
          reference_number: 'TXN001',
          attachments: [],
          created_at: '2024-03-01',
          updated_at: '2024-03-01'
        },
        {
          id: '2',
          type: 'expense',
          amount: 12000,
          description: 'راتب فريق التطوير - مارس',
          category: 'رواتب',
          project_id: '1',
          project_name: 'تطوير نظام المحاسبة',
          date: '2024-03-01',
          status: 'approved',
          created_by: '1',
          approved_by: '1',
          reference_number: 'TXN002',
          attachments: [],
          created_at: '2024-03-01',
          updated_at: '2024-03-01'
        },
        {
          id: '3',
          type: 'expense',
          amount: 5000,
          description: 'مواد خام للمشروع',
          category: 'مواد خام',
          project_id: '2',
          project_name: 'تحديث الموقع الإلكتروني',
          date: '2024-03-02',
          status: 'pending',
          created_by: '3',
          reference_number: 'TXN003',
          attachments: [],
          created_at: '2024-03-02',
          updated_at: '2024-03-02'
        }
      ];
      
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('خطأ في تحميل المعاملات:', error);
    } finally {
      setLoading(false);
    }
  };

  // حساب الإحصائيات
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'expense' && t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const pendingTransactions = transactions.filter(t => t.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="view_transactions" userProfile={userProfile}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة المعاملات المالية</h1>
            <p className="text-gray-600">تتبع وإدارة جميع المعاملات المالية</p>
          </div>
          
          <PermissionWrapper permission="create_transaction" userProfile={userProfile}>
            <ActionButton
              label="معاملة جديدة"
              permission="create_transaction"
              variant="primary"
              icon="💰+"
              onClick={() => setShowCreateForm(true)}
            />
          </PermissionWrapper>
        </div>

        {/* إحصائيات المعاملات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="إجمالي الواردات"
            value={`${totalIncome.toLocaleString()} ر.س`}
            icon="⬆️"
            className="border-r-4 border-green-500"
            permission="view_transactions"
          />
          <DashboardCard
            title="إجمالي المصروفات"
            value={`${totalExpense.toLocaleString()} ر.س`}
            icon="⬇️"
            className="border-r-4 border-red-500"
            permission="view_transactions"
          />
          <DashboardCard
            title="الرصيد الحالي"
            value={`${(totalIncome - totalExpense).toLocaleString()} ر.س`}
            icon="💰"
            className="border-r-4 border-blue-500"
            permission="view_transactions"
          />
          <DashboardCard
            title="معاملات قيد الانتظار"
            value={pendingTransactions.length.toString()}
            icon="⏳"
            className="border-r-4 border-yellow-500"
            permission="view_transactions"
          />
        </div>

        {/* فلاتر البحث */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">فلتر المعاملات</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الأنواع</option>
                <option value="income">واردات</option>
                <option value="expense">مصروفات</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="approved">معتمد</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilter({ type: 'all', status: 'all', dateFrom: '', dateTo: '', project: 'all' })}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                مسح الفلاتر
              </button>
            </div>
          </div>
        </div>

        {/* قائمة المعاملات */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">قائمة المعاملات</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {transactions.map(transaction => (
              <TransactionCard 
                key={transaction.id} 
                transaction={transaction} 
                onUpdate={loadTransactions}
              />
            ))}
          </div>
        </div>

        {/* نموذج إنشاء معاملة جديدة */}
        {showCreateForm && (
          <TransactionCreateModal
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
              loadTransactions();
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// بطاقة عرض المعاملة
function TransactionCard({ transaction, onUpdate }: { transaction: Transaction; onUpdate: () => void }) {
  const { userProfile } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'معتمد';
      case 'pending': return 'قيد الانتظار';
      case 'rejected': return 'مرفوض';
      default: return 'غير محدد';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const getTypeIcon = (type: string) => {
    return type === 'income' ? '⬆️' : '⬇️';
  };

  const handleApprove = async () => {
    if (confirm('هل أنت متأكد من اعتماد هذه المعاملة؟')) {
      // هنا نرسل طلب الاعتماد للـ API
      alert(`تم اعتماد المعاملة رقم: ${transaction.reference_number}`);
      onUpdate();
    }
  };

  const handleReject = async () => {
    if (confirm('هل أنت متأكد من رفض هذه المعاملة؟')) {
      // هنا نرسل طلب الرفض للـ API
      alert(`تم رفض المعاملة رقم: ${transaction.reference_number}`);
      onUpdate();
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-lg mr-2">{getTypeIcon(transaction.type)}</span>
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  {transaction.description}
                </h4>
                <p className="text-sm text-gray-600">
                  {transaction.category} • {transaction.reference_number}
                </p>
              </div>
            </div>
            
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
              {getStatusLabel(transaction.status)}
            </span>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-700">المبلغ:</span>
              <p className={`text-lg font-semibold ${getTypeColor(transaction.type)}`}>
                {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()} ر.س
              </p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700">التاريخ:</span>
              <p className="text-sm text-gray-900">{transaction.date}</p>
            </div>
            
            {transaction.project_name && (
              <div>
                <span className="text-sm font-medium text-gray-700">المشروع:</span>
                <p className="text-sm text-blue-600">{transaction.project_name}</p>
              </div>
            )}
            
            <div>
              <span className="text-sm font-medium text-gray-700">أنشأ بواسطة:</span>
              <p className="text-sm text-gray-900">{transaction.created_by}</p>
            </div>
          </div>
        </div>

        <div className="flex space-x-2 mr-4">
          {transaction.status === 'pending' && (
            <>
              <PermissionWrapper permission="approve_transaction" userProfile={userProfile}>
                <ActionButton
                  label="اعتماد"
                  permission="approve_transaction"
                  variant="success"
                  size="sm"
                  onClick={handleApprove}
                />
              </PermissionWrapper>
              
              <PermissionWrapper permission="approve_transaction" userProfile={userProfile}>
                <ActionButton
                  label="رفض"
                  permission="approve_transaction"
                  variant="danger"
                  size="sm"
                  onClick={handleReject}
                />
              </PermissionWrapper>
            </>
          )}
          
          <PermissionWrapper permission="edit_transaction" userProfile={userProfile}>
            <ActionButton
              label="تعديل"
              permission="edit_transaction"
              variant="secondary"
              size="sm"
              onClick={() => alert(`تعديل المعاملة: ${transaction.reference_number}`)}
            />
          </PermissionWrapper>
        </div>
      </div>
    </div>
  );
}

// نموذج إنشاء معاملة جديدة
function TransactionCreateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    amount: 0,
    description: '',
    category: '',
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    reference_number: `TXN${Date.now()}`
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'وصف المعاملة مطلوب';
    }
    
    if (formData.amount <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون أكبر من صفر';
    }
    
    if (!formData.category) {
      newErrors.category = 'فئة المعاملة مطلوبة';
    }
    
    if (!formData.date) {
      newErrors.date = 'تاريخ المعاملة مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // هنا نرسل البيانات لـ API
      console.log('إنشاء معاملة جديدة:', formData);
      
      // محاكاة تأخير API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('تم إنشاء المعاملة بنجاح!');
      onSuccess();
    } catch (error) {
      console.error('خطأ في إنشاء المعاملة:', error);
      alert('حدث خطأ في إنشاء المعاملة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">إضافة معاملة مالية جديدة</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع المعاملة *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense', category: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="income">واردات</option>
                <option value="expense">مصروفات</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الفئة *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">اختر الفئة</option>
                {TRANSACTION_CATEGORIES[formData.type].map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              وصف المعاملة *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="أدخل وصف تفصيلي للمعاملة"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المبلغ (ر.س) *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
                step="0.01"
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ المعاملة *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم المرجع
            </label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="رقم المرجع أو الفاتورة"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'جارٍ الحفظ...' : 'حفظ المعاملة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
