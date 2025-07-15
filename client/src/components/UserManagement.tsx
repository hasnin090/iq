import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './guards';
import { PermissionWrapper } from './PermissionWrapper';
import { ActionButton, DashboardCard } from './ui/PermissionComponents';

// 👥 نظام إدارة المستخدمين والموظفين المتكامل
// ==============================================

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  department: string;
  position: string;
  hire_date: string;
  salary?: number;
  avatar?: string;
  permissions: string[];
  last_login?: string;
  created_at: string;
  updated_at: string;
}

interface Employee extends User {
  employee_id: string;
  contract_type: 'full_time' | 'part_time' | 'contract';
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  };
  address: {
    street: string;
    city: string;
    postal_code: string;
  };
  attendance_records: AttendanceRecord[];
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in: string;
  check_out?: string;
  hours_worked: number;
  status: 'present' | 'absent' | 'late' | 'half_day';
  notes?: string;
}

const DEPARTMENTS = [
  'الإدارة العامة',
  'تطوير البرمجيات',
  'التسويق',
  'المحاسبة',
  'الموارد البشرية',
  'خدمة العملاء',
  'المبيعات'
];

const POSITIONS = [
  'مدير عام',
  'مدير قسم',
  'مطور برمجيات',
  'مصمم',
  'محاسب',
  'أخصائي تسويق',
  'موظف مبيعات',
  'موظف خدمة عملاء'
];

// الصفحة الرئيسية لإدارة المستخدمين
export function UserManagementPage() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'employees' | 'attendance'>('users');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // محاكاة بيانات المستخدمين
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'أحمد محمد',
          email: 'ahmed@company.com',
          phone: '0501234567',
          role: 'admin',
          status: 'active',
          department: 'الإدارة العامة',
          position: 'مدير عام',
          hire_date: '2020-01-15',
          salary: 15000,
          permissions: ['all'],
          last_login: '2024-03-15T10:30:00',
          created_at: '2020-01-15',
          updated_at: '2024-03-15'
        },
        {
          id: '2',
          name: 'سارة أحمد',
          email: 'sara@company.com',
          phone: '0507654321',
          role: 'manager',
          status: 'active',
          department: 'تطوير البرمجيات',
          position: 'مدير قسم',
          hire_date: '2021-03-01',
          salary: 12000,
          permissions: ['manage_projects', 'view_reports'],
          last_login: '2024-03-15T09:15:00',
          created_at: '2021-03-01',
          updated_at: '2024-03-15'
        },
        {
          id: '3',
          name: 'محمد علي',
          email: 'mohamed@company.com',
          phone: '0509876543',
          role: 'user',
          status: 'active',
          department: 'تطوير البرمجيات',
          position: 'مطور برمجيات',
          hire_date: '2022-06-15',
          salary: 8000,
          permissions: ['view_projects', 'create_tasks'],
          last_login: '2024-03-14T16:45:00',
          created_at: '2022-06-15',
          updated_at: '2024-03-14'
        }
      ];

      // محاكاة بيانات الموظفين المفصلة
      const mockEmployees: Employee[] = mockUsers.map(user => ({
        ...user,
        employee_id: `EMP${user.id.padStart(3, '0')}`,
        contract_type: 'full_time' as const,
        emergency_contact: {
          name: 'جهة اتصال طوارئ',
          phone: '0501111111',
          relationship: 'والد/والدة'
        },
        address: {
          street: 'شارع الملك فهد',
          city: 'الرياض',
          postal_code: '12345'
        },
        attendance_records: []
      }));

      setUsers(mockUsers);
      setEmployees(mockEmployees);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  // حساب الإحصائيات
  const activeUsers = users.filter(u => u.status === 'active').length;
  const totalEmployees = employees.length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="view_users" userProfile={userProfile}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين والموظفين</h1>
            <p className="text-gray-600">إدارة شاملة للمستخدمين وبيانات الموظفين</p>
          </div>
          
          <PermissionWrapper permission="create_user" userProfile={userProfile}>
            <ActionButton
              label="مستخدم جديد"
              permission="create_user"
              variant="primary"
              icon="👤+"
              onClick={() => setShowCreateForm(true)}
            />
          </PermissionWrapper>
        </div>

        {/* إحصائيات المستخدمين */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="المستخدمين النشطين"
            value={activeUsers.toString()}
            icon="👥"
            className="border-r-4 border-green-500"
            permission="view_users"
          />
          <DashboardCard
            title="إجمالي الموظفين"
            value={totalEmployees.toString()}
            icon="🏢"
            className="border-r-4 border-blue-500"
            permission="view_employees"
          />
          <DashboardCard
            title="المديرين"
            value={adminUsers.toString()}
            icon="👑"
            className="border-r-4 border-purple-500"
            permission="view_users"
          />
          <DashboardCard
            title="الحسابات المعلقة"
            value={suspendedUsers.toString()}
            icon="⚠️"
            className="border-r-4 border-red-500"
            permission="view_users"
          />
        </div>

        {/* تبويبات النظام */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                المستخدمين
              </button>
              <PermissionWrapper permission="view_employees" userProfile={userProfile}>
                <button
                  onClick={() => setActiveTab('employees')}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'employees'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  بيانات الموظفين
                </button>
              </PermissionWrapper>
              <PermissionWrapper permission="view_attendance" userProfile={userProfile}>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'attendance'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  الحضور والغياب
                </button>
              </PermissionWrapper>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <UsersTab 
                users={users} 
                onUpdate={loadData}
                onSelectUser={setSelectedUser}
              />
            )}
            {activeTab === 'employees' && (
              <EmployeesTab 
                employees={employees} 
                onUpdate={loadData}
              />
            )}
            {activeTab === 'attendance' && (
              <AttendanceTab 
                employees={employees}
              />
            )}
          </div>
        </div>

        {/* نموذج إنشاء مستخدم جديد */}
        {showCreateForm && (
          <UserCreateModal
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
              loadData();
            }}
          />
        )}

        {/* نموذج تفاصيل المستخدم */}
        {selectedUser && (
          <UserDetailsModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onUpdate={loadData}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// تبويب المستخدمين
function UsersTab({ users, onUpdate, onSelectUser }: { 
  users: User[]; 
  onUpdate: () => void;
  onSelectUser: (user: User) => void;
}) {
  const { userProfile } = useAuth();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير عام';
      case 'manager': return 'مدير';
      case 'user': return 'موظف';
      case 'viewer': return 'مشاهد';
      default: return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'inactive': return 'غير نشط';
      case 'suspended': return 'معلق';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">قائمة المستخدمين</h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
            تصدير Excel
          </button>
          <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">
            فلتر
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المستخدم
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الدور
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                القسم
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                آخر دخول
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0)}
                      </div>
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getRoleLabel(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                    {getStatusLabel(user.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString('ar-SA') : 'لم يدخل بعد'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onSelectUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      عرض
                    </button>
                    <PermissionWrapper permission="edit_user" userProfile={userProfile}>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        تعديل
                      </button>
                    </PermissionWrapper>
                    <PermissionWrapper permission="delete_user" userProfile={userProfile}>
                      <button className="text-red-600 hover:text-red-900">
                        حذف
                      </button>
                    </PermissionWrapper>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// تبويب بيانات الموظفين
function EmployeesTab({ employees, onUpdate }: { employees: Employee[]; onUpdate: () => void }) {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">بيانات الموظفين التفصيلية</h3>
        <PermissionWrapper permission="export_data" userProfile={userProfile}>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            تصدير كشف الرواتب
          </button>
        </PermissionWrapper>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((employee) => (
          <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-shrink-0 h-12 w-12">
                <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-lg">
                  {employee.name.charAt(0)}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">{employee.name}</h4>
                <p className="text-sm text-gray-500">{employee.employee_id}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">المنصب:</span>
                <p className="text-sm text-gray-900">{employee.position}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">القسم:</span>
                <p className="text-sm text-gray-900">{employee.department}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">تاريخ التوظيف:</span>
                <p className="text-sm text-gray-900">{employee.hire_date}</p>
              </div>
              
              <PermissionWrapper permission="view_salaries" userProfile={userProfile}>
                <div>
                  <span className="text-sm font-medium text-gray-700">الراتب:</span>
                  <p className="text-sm text-green-600 font-medium">
                    {employee.salary?.toLocaleString()} ر.س
                  </p>
                </div>
              </PermissionWrapper>
              
              <div>
                <span className="text-sm font-medium text-gray-700">نوع العقد:</span>
                <p className="text-sm text-gray-900">
                  {employee.contract_type === 'full_time' ? 'دوام كامل' : 
                   employee.contract_type === 'part_time' ? 'دوام جزئي' : 'مؤقت'}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <PermissionWrapper permission="edit_employee" userProfile={userProfile}>
                  <button className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">
                    تعديل البيانات
                  </button>
                </PermissionWrapper>
                <button className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                  عرض التفاصيل
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// تبويب الحضور والغياب
function AttendanceTab({ employees }: { employees: Employee[] }) {
  const { userProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">تسجيل الحضور والغياب</h3>
        <div className="flex space-x-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <PermissionWrapper permission="export_attendance" userProfile={userProfile}>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              تصدير التقرير
            </button>
          </PermissionWrapper>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-yellow-600">⚡</span>
          </div>
          <div className="mr-3">
            <h3 className="text-sm font-medium text-yellow-800">
              تسجيل سريع للحضور
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>يمكنك تسجيل حضور اليوم بنقرة واحدة لجميع الموظفين</p>
            </div>
            <div className="mt-3">
              <PermissionWrapper permission="mark_attendance" userProfile={userProfile}>
                <button className="bg-yellow-600 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-700">
                  تسجيل حضور جماعي
                </button>
              </PermissionWrapper>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الموظف
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                وقت الدخول
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                وقت الخروج
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                ساعات العمل
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {employee.name.charAt(0)}
                      </div>
                    </div>
                    <div className="mr-3">
                      <div className="text-sm font-medium text-gray-900">
                        {employee.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {employee.employee_id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  08:30
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  17:00
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  8.5 ساعة
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    حاضر
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <PermissionWrapper permission="edit_attendance" userProfile={userProfile}>
                    <button className="text-indigo-600 hover:text-indigo-900">
                      تعديل
                    </button>
                  </PermissionWrapper>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// نموذج إنشاء مستخدم جديد
function UserCreateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user' as const,
    department: '',
    position: '',
    salary: 0,
    hire_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'الاسم مطلوب';
    if (!formData.email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب';
    if (!formData.phone.trim()) newErrors.phone = 'رقم الهاتف مطلوب';
    if (!formData.department) newErrors.department = 'القسم مطلوب';
    if (!formData.position) newErrors.position = 'المنصب مطلوب';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      console.log('إنشاء مستخدم جديد:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('تم إنشاء المستخدم بنجاح!');
      onSuccess();
    } catch (error) {
      console.error('خطأ في إنشاء المستخدم:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">إضافة مستخدم جديد</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الدور *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">موظف</option>
                <option value="manager">مدير</option>
                <option value="admin">مدير عام</option>
                <option value="viewer">مشاهد</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">القسم *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.department ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">اختر القسم</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المنصب *</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.position ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">اختر المنصب</option>
                {POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
              {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التوظيف</label>
              <input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <PermissionWrapper permission="manage_salaries" userProfile={userProfile}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الراتب (ر.س)</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </PermissionWrapper>
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
              {loading ? 'جارٍ الحفظ...' : 'حفظ المستخدم'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// نموذج تفاصيل المستخدم
function UserDetailsModal({ user, onClose, onUpdate }: { 
  user: User; 
  onClose: () => void; 
  onUpdate: () => void; 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">تفاصيل المستخدم</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-xl">
              {user.name.charAt(0)}
            </div>
            <div>
              <h4 className="text-xl font-medium text-gray-900">{user.name}</h4>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">معلومات أساسية</h5>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500">الهاتف:</span>
                  <p className="text-sm">{user.phone}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">الدور:</span>
                  <p className="text-sm">{user.role}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">الحالة:</span>
                  <p className="text-sm">{user.status}</p>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">معلومات العمل</h5>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500">القسم:</span>
                  <p className="text-sm">{user.department}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">المنصب:</span>
                  <p className="text-sm">{user.position}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">تاريخ التوظيف:</span>
                  <p className="text-sm">{user.hire_date}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">الصلاحيات</h5>
            <div className="flex flex-wrap gap-2">
              {user.permissions.slice(0, 5).map((permission, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {permission}
                </span>
              ))}
              {user.permissions.length > 5 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{user.permissions.length - 5} أخرى
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            إغلاق
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            تعديل البيانات
          </button>
        </div>
      </div>
    </div>
  );
}
