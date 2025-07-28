import React, { useState } from 'react';

// أنواع البيانات الأساسية
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  totalEmployees: number;
  totalExpenseTypes: number;
}

// مكون تسجيل الدخول
const Login: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        const user: User = {
          id: 1,
          username: 'admin',
          name: 'المدير العام',
          email: 'admin@example.com',
          role: 'admin',
          permissions: ['manage_all'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        onLogin(user);
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏢 نظام المحاسبة العربي
            </h1>
            <p className="text-gray-600">شركة طريق العامرة</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                اسم المستخدم
              </label>
              <input
                id="username"
                type="text"
                required
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل اسم المستخدم"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                required
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل كلمة المرور"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">بيانات تجريبية:</h3>
            <p className="text-xs text-gray-600">
              اسم المستخدم: <code className="bg-gray-200 px-1 rounded">admin</code>
            </p>
            <p className="text-xs text-gray-600">
              كلمة المرور: <code className="bg-gray-200 px-1 rounded">admin123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// مكون لوحة التحكم
const Dashboard: React.FC<{ user: User; onLogout: () => void; onNavigate: (page: string) => void }> = ({ user, onLogout, onNavigate }) => {
  const [stats] = useState<DashboardStats>({
    totalProjects: 5,
    activeProjects: 3,
    totalTransactions: 124,
    totalIncome: 150000,
    totalExpenses: 75000,
    totalEmployees: 12,
    totalExpenseTypes: 8
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* الشريط العلوي */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                نظام المحاسبة العربي
              </h1>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-gray-700">مرحباً، {user.name}</span>
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">لوحة التحكم</h2>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="إجمالي المشاريع"
              value={stats.totalProjects}
              icon="🏗️"
              color="bg-blue-500"
            />
            <StatCard
              title="المشاريع النشطة"
              value={stats.activeProjects}
              icon="🔄"
              color="bg-green-500"
            />
            <StatCard
              title="إجمالي المعاملات"
              value={stats.totalTransactions}
              icon="💰"
              color="bg-purple-500"
            />
            <StatCard
              title="عدد الموظفين"
              value={stats.totalEmployees}
              icon="👥"
              color="bg-orange-500"
            />
          </div>

          {/* الإيرادات والمصروفات */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                الملخص المالي
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">إجمالي الإيرادات:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(stats.totalIncome)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">إجمالي المصروفات:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(stats.totalExpenses)}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">صافي الربح:</span>
                  <span className={`font-bold ${
                    stats.totalIncome - stats.totalExpenses >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(stats.totalIncome - stats.totalExpenses)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                روابط سريعة
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickLink title="المشاريع" icon="🏗️" onClick={() => onNavigate('projects')} />
                <QuickLink title="المعاملات" icon="💰" onClick={() => onNavigate('transactions')} />
                <QuickLink title="الموظفين" icon="👥" onClick={() => onNavigate('employees')} />
                <QuickLink title="التقارير" icon="📊" onClick={() => onNavigate('reports')} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// مكون بطاقة الإحصائيات
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: string;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`${color} rounded-md p-3 text-white text-2xl`}>
            {icon}
          </div>
        </div>
        <div className="mr-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="text-2xl font-semibold text-gray-900">
              {value.toLocaleString('ar-SA')}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

// مكون الروابط السريعة
const QuickLink: React.FC<{
  title: string;
  icon: string;
  onClick?: () => void;
}> = ({ title, icon, onClick }) => (
  <button
    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    onClick={onClick}
  >
    <span className="text-xl ml-3">{icon}</span>
    <span className="font-medium text-gray-700">{title}</span>
  </button>
);

// صفحة المشاريع
const ProjectsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-semibold text-gray-900">المشاريع</h1>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >عودة للوحة التحكم</button>
        </div>
      </div>
    </header>
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">قائمة المشاريع</h2>
        <ul className="space-y-4">
          {/* بيانات تجريبية */}
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span className="font-medium text-gray-800">مشروع تطوير نظام محاسبة</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">نشط</span>
          </li>
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span className="font-medium text-gray-800">مشروع بناء قاعدة بيانات</span>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">مكتمل</span>
          </li>
        </ul>
      </div>
    </main>
  </div>
);

// صفحة المعاملات
const TransactionsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-semibold text-gray-900">المعاملات</h1>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >عودة للوحة التحكم</button>
        </div>
      </div>
    </header>
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">قائمة المعاملات</h2>
        <ul className="space-y-4">
          {/* بيانات تجريبية */}
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span className="font-medium text-gray-800">إيداع نقدي</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">+ 10,000 ريال</span>
          </li>
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span className="font-medium text-gray-800">سحب مصروفات مكتبية</span>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">- 2,500 ريال</span>
          </li>
        </ul>
      </div>
    </main>
  </div>
);

// صفحة الموظفين
const EmployeesPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-semibold text-gray-900">الموظفين</h1>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >عودة للوحة التحكم</button>
        </div>
      </div>
    </header>
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">قائمة الموظفين</h2>
        <ul className="space-y-4">
          {/* بيانات تجريبية */}
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span className="font-medium text-gray-800">أحمد علي</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">محاسب</span>
          </li>
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span className="font-medium text-gray-800">سارة محمد</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">مدير مشاريع</span>
          </li>
        </ul>
      </div>
    </main>
  </div>
);

// صفحة التقارير
const ReportsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-semibold text-gray-900">التقارير</h1>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >عودة للوحة التحكم</button>
        </div>
      </div>
    </header>
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">قائمة التقارير</h2>
        <ul className="space-y-4">
          {/* بيانات تجريبية */}
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span className="font-medium text-gray-800">تقرير الإيرادات الشهرية</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">يونيو 2025</span>
          </li>
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span className="font-medium text-gray-800">تقرير المصروفات السنوية</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">2024</span>
          </li>
        </ul>
      </div>
    </main>
  </div>
);

// التطبيق الرئيسي مع التنقل بين لوحة التحكم وصفحة المشاريع
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'projects' | 'transactions' | 'employees' | 'reports'>('dashboard');

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
    console.log('تم تسجيل الدخول:', user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('dashboard');
    console.log('تم تسجيل الخروج');
  };

  const handleNavigate = (page: string) => {
    if (page === 'projects') setCurrentPage('projects');
    if (page === 'transactions') setCurrentPage('transactions');
    if (page === 'employees') setCurrentPage('employees');
    if (page === 'reports') setCurrentPage('reports');
    // يمكن إضافة صفحات أخرى لاحقاً
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentPage === 'projects') {
    return <ProjectsPage onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'transactions') {
    return <TransactionsPage onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'employees') {
    return <EmployeesPage onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'reports') {
    return <ReportsPage onBack={() => setCurrentPage('dashboard')} />;
  }

  return <Dashboard user={currentUser} onLogout={handleLogout} onNavigate={handleNavigate} />;
};

export default App;
