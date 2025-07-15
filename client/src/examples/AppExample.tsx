import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/guards';
import { PermissionWrapper, AdminOnly, ManagerOnly } from './components/PermissionWrapper';
import { ActionButton, DashboardCard, NavigationMenu } from './components/ui/PermissionComponents';
import { useAuth } from './context/AuthContext';

// 🎯 مثال تطبيق كامل مع نظام الصلاحيات
// ==========================================

// مكون التطبيق الرئيسي
function App() {
  return (
    <AuthProvider>
      <div dir="rtl" className="min-h-screen bg-gray-50">
        <Router>
          <MainLayout />
        </Router>
      </div>
    </AuthProvider>
  );
}

// تخطيط رئيسي مع شريط جانبي
function MainLayout() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* الشريط الجانبي */}
      <Sidebar />
      
      {/* المحتوى الرئيسي */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* الصفحة الرئيسية */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute 
                requiredPermission="view_dashboard"
                userProfile={userProfile}
              >
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* المشاريع */}
          <Route 
            path="/projects" 
            element={
              <ProtectedRoute 
                requiredPermission="view_projects"
                userProfile={userProfile}
              >
                <ProjectsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* إدارة المستخدمين - خاص بالمديرين */}
          <Route 
            path="/users" 
            element={
              <ProtectedRoute 
                requiredPermission="manage_users"
                userProfile={userProfile}
              >
                <UsersManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* المعاملات المالية */}
          <Route 
            path="/transactions" 
            element={
              <ProtectedRoute 
                requiredPermission="view_transactions"
                userProfile={userProfile}
              >
                <TransactionsPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

// الشريط الجانبي مع قائمة التنقل
function Sidebar() {
  const { userProfile } = useAuth();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      href: '/',
      icon: '🏠',
      permission: 'view_dashboard'
    },
    {
      id: 'projects',
      label: 'المشاريع',
      href: '/projects',
      icon: '📁',
      permission: 'view_projects',
      children: [
        {
          id: 'new-project',
          label: 'مشروع جديد',
          href: '/projects/new',
          permission: 'create_project'
        },
        {
          id: 'project-reports',
          label: 'تقارير المشاريع',
          href: '/projects/reports',
          permission: 'view_reports'
        }
      ]
    },
    {
      id: 'transactions',
      label: 'المعاملات المالية',
      href: '/transactions',
      icon: '💰',
      permission: 'view_transactions'
    },
    {
      id: 'users',
      label: 'إدارة المستخدمين',
      href: '/users',
      icon: '👥',
      role: 'admin' // خاص بالمديرين فقط
    },
    {
      id: 'employees',
      label: 'الموظفين',
      href: '/employees',
      icon: '👤',
      permission: 'view_employees'
    },
    {
      id: 'accounting',
      label: 'المحاسبة',
      href: '/accounting',
      icon: '🧮',
      permission: 'view_ledger'
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      href: '/settings',
      icon: '⚙️',
      permission: 'view_settings'
    }
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">نظام الإدارة</h2>
        {userProfile && (
          <p className="text-sm text-gray-600">مرحباً، {userProfile.full_name}</p>
        )}
      </div>
      
      <NavigationMenu 
        items={navigationItems}
        className="p-2"
      />
    </div>
  );
}

// لوحة التحكم الرئيسية
function Dashboard() {
  const { userProfile } = useAuth();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-600">نظرة عامة على النظام</p>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="إجمالي المشاريع"
          value="25"
          icon="📁"
          permission="view_projects"
          description="مشاريع نشطة"
          onClick={() => window.location.href = '/projects'}
        />
        
        <DashboardCard
          title="المعاملات اليوم"
          value="1,234 ر.س"
          icon="💰"
          permission="view_transactions"
          description="إجمالي اليوم"
        />
        
        <DashboardCard
          title="المستخدمين النشطين"
          value="48"
          icon="👥"
          permission="view_users"
          description="متصلين الآن"
        />
        
        <DashboardCard
          title="التقارير الجديدة"
          value="7"
          icon="📊"
          permission="view_reports"
          description="تقارير جديدة"
        />
      </div>

      {/* أقسام خاصة بالأدوار */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* قسم خاص بالمديرين */}
        <AdminOnly userProfile={userProfile}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-4">
              🔐 لوحة المدير
            </h3>
            <div className="space-y-3">
              <ActionButton
                label="إدارة المستخدمين"
                permission="manage_users"
                variant="primary"
                onClick={() => window.location.href = '/users'}
              />
              <ActionButton
                label="إعدادات النظام"
                permission="manage_system"
                variant="secondary"
                onClick={() => window.location.href = '/settings'}
              />
              <ActionButton
                label="نسخ احتياطي"
                permission="backup_system"
                variant="success"
                onClick={() => alert('سيتم إنشاء نسخة احتياطية...')}
              />
            </div>
          </div>
        </AdminOnly>

        {/* قسم خاص بالمديرين والمدراء */}
        <ManagerOnly userProfile={userProfile}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              👨‍💼 لوحة المدير
            </h3>
            <div className="space-y-3">
              <ActionButton
                label="إنشاء مشروع جديد"
                permission="create_project"
                variant="primary"
                onClick={() => window.location.href = '/projects/new'}
              />
              <ActionButton
                label="تقارير الأداء"
                permission="view_reports"
                variant="secondary"
                onClick={() => window.location.href = '/reports'}
              />
            </div>
          </div>
        </ManagerOnly>

        {/* قسم الإجراءات السريعة */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ⚡ إجراءات سريعة
          </h3>
          <div className="space-y-3">
            <PermissionWrapper permission="create_transaction" userProfile={userProfile}>
              <ActionButton
                label="معاملة مالية جديدة"
                permission="create_transaction"
                variant="success"
                onClick={() => window.location.href = '/transactions/new'}
              />
            </PermissionWrapper>
            
            <PermissionWrapper permission="upload_document" userProfile={userProfile}>
              <ActionButton
                label="رفع مستند"
                permission="upload_document"
                variant="secondary"
                onClick={() => window.location.href = '/documents/upload'}
              />
            </PermissionWrapper>
            
            <PermissionWrapper permission="view_reports" userProfile={userProfile}>
              <ActionButton
                label="عرض التقارير"
                permission="view_reports"
                variant="primary"
                onClick={() => window.location.href = '/reports'}
              />
            </PermissionWrapper>
          </div>
        </div>
      </div>
    </div>
  );
}

// صفحة المشاريع
function ProjectsPage() {
  const { userProfile } = useAuth();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المشاريع</h1>
          <p className="text-gray-600">إدارة جميع مشاريع الشركة</p>
        </div>
        
        <PermissionWrapper permission="create_project" userProfile={userProfile}>
          <ActionButton
            label="مشروع جديد"
            permission="create_project"
            variant="primary"
            icon="➕"
            onClick={() => window.location.href = '/projects/new'}
          />
        </PermissionWrapper>
      </div>

      {/* قائمة المشاريع */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            المشاريع النشطة
          </h3>
          
          {/* هنا يمكن إضافة قائمة المشاريع الفعلية */}
          <div className="space-y-4">
            {[1, 2, 3].map(project => (
              <div key={project} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      مشروع تطوير النظام #{project}
                    </h4>
                    <p className="text-sm text-gray-600">
                      بدأ في 2024/01/15 - حالة: نشط
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <PermissionWrapper permission="edit_project" userProfile={userProfile}>
                      <ActionButton
                        label="تعديل"
                        permission="edit_project"
                        variant="secondary"
                        size="sm"
                        onClick={() => alert(`تعديل المشروع ${project}`)}
                      />
                    </PermissionWrapper>
                    
                    <PermissionWrapper permission="delete_project" userProfile={userProfile}>
                      <ActionButton
                        label="حذف"
                        permission="delete_project"
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف المشروع؟')) {
                            alert(`تم حذف المشروع ${project}`);
                          }
                        }}
                      />
                    </PermissionWrapper>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// صفحة إدارة المستخدمين
function UsersManagement() {
  const { userProfile } = useAuth();

  return (
    <div className="p-6">
      <AdminOnly userProfile={userProfile}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
            <p className="text-gray-600">إضافة وتعديل وإدارة صلاحيات المستخدمين</p>
          </div>
          
          <ActionButton
            label="إضافة مستخدم"
            permission="create_user"
            variant="primary"
            icon="👤+"
            onClick={() => window.location.href = '/users/new'}
          />
        </div>

        {/* إحصائيات المستخدمين */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <DashboardCard
            title="إجمالي المستخدمين"
            value="48"
            icon="👥"
            permission="view_users"
          />
          <DashboardCard
            title="المديرين"
            value="3"
            icon="👑"
            permission="view_users"
          />
          <DashboardCard
            title="المدراء"
            value="8"
            icon="👨‍💼"
            permission="view_users"
          />
          <DashboardCard
            title="المستخدمين العاديين"
            value="37"
            icon="👤"
            permission="view_users"
          />
        </div>

        {/* جدول المستخدمين */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              قائمة المستخدمين
            </h3>
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
                    المشاريع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* هنا يمكن إضافة بيانات المستخدمين الفعلية */}
                {[
                  { name: 'أحمد محمد', role: 'admin', projects: 'جميع المشاريع' },
                  { name: 'فاطمة علي', role: 'manager', projects: '5 مشاريع' },
                  { name: 'محمد حسن', role: 'user', projects: '2 مشاريع' }
                ].map((user, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            user{index + 1}@example.com
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'}
                      `}>
                        {user.role === 'admin' ? 'مدير عام' :
                         user.role === 'manager' ? 'مدير' : 'مستخدم'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.projects}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <ActionButton
                          label="تعديل"
                          permission="edit_user"
                          variant="secondary"
                          size="sm"
                          onClick={() => alert(`تعديل ${user.name}`)}
                        />
                        <ActionButton
                          label="الصلاحيات"
                          permission="assign_permissions"
                          variant="primary"
                          size="sm"
                          onClick={() => alert(`إدارة صلاحيات ${user.name}`)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminOnly>
    </div>
  );
}

// صفحة المعاملات المالية
function TransactionsPage() {
  const { userProfile } = useAuth();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المعاملات المالية</h1>
          <p className="text-gray-600">إدارة جميع المعاملات المالية</p>
        </div>
        
        <PermissionWrapper permission="create_transaction" userProfile={userProfile}>
          <ActionButton
            label="معاملة جديدة"
            permission="create_transaction"
            variant="primary"
            icon="💰+"
            onClick={() => window.location.href = '/transactions/new'}
          />
        </PermissionWrapper>
      </div>

      {/* إحصائيات المعاملات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <DashboardCard
          title="إجمالي اليوم"
          value="12,450 ر.س"
          icon="💰"
          permission="view_transactions"
          description="15 معاملة"
        />
        <DashboardCard
          title="الواردات"
          value="8,200 ر.س"
          icon="⬆️"
          permission="view_transactions"
          description="10 معاملات"
        />
        <DashboardCard
          title="المصروفات"
          value="4,250 ر.س"
          icon="⬇️"
          permission="view_transactions"
          description="5 معاملات"
        />
      </div>

      {/* قائمة المعاملات */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            آخر المعاملات
          </h3>
          
          <div className="space-y-4">
            {[
              { id: '001', type: 'وارد', amount: '2,500', description: 'دفعة مقدمة مشروع أ' },
              { id: '002', type: 'صادر', amount: '1,200', description: 'مواد خام' },
              { id: '003', type: 'وارد', amount: '5,000', description: 'دفعة نهائية مشروع ب' }
            ].map(transaction => (
              <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`
                        px-2 py-1 text-xs font-semibold rounded-full
                        ${transaction.type === 'وارد' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      `}>
                        {transaction.type}
                      </span>
                      <span className="text-lg font-medium text-gray-900">
                        {transaction.amount} ر.س
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {transaction.description}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <PermissionWrapper permission="edit_transaction" userProfile={userProfile}>
                      <ActionButton
                        label="تعديل"
                        permission="edit_transaction"
                        variant="secondary"
                        size="sm"
                        onClick={() => alert(`تعديل المعاملة ${transaction.id}`)}
                      />
                    </PermissionWrapper>
                    
                    <PermissionWrapper permission="approve_transaction" userProfile={userProfile}>
                      <ActionButton
                        label="اعتماد"
                        permission="approve_transaction"
                        variant="success"
                        size="sm"
                        onClick={() => alert(`اعتماد المعاملة ${transaction.id}`)}
                      />
                    </PermissionWrapper>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// صفحة تسجيل الدخول
function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await signIn(email, password);
    
    if (result.success) {
      window.location.href = '/';
    } else {
      alert(result.error || 'فشل في تسجيل الدخول');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            تسجيل الدخول
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            نظام إدارة المشاريع والمحاسبة
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
