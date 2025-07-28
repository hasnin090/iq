import React, { useState, useEffect } from 'react';
import { User, DashboardStats } from '../types';
import apiService from '../services/api';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response: any = await apiService.dashboard();
      setStats(response.data || {
        totalProjects: 0,
        activeProjects: 0,
        totalTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0,
        totalEmployees: 0,
        totalExpenseTypes: 0
      });
    } catch (err) {
      setError('فشل في تحميل بيانات لوحة التحكم');
      // بيانات تجريبية في حالة الخطأ
      setStats({
        totalProjects: 5,
        activeProjects: 3,
        totalTransactions: 124,
        totalIncome: 150000,
        totalExpenses: 75000,
        totalEmployees: 12,
        totalExpenseTypes: 8
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

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

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md mb-6">
              {error} - يتم عرض بيانات تجريبية
            </div>
          )}

          {/* إحصائيات سريعة */}
          {stats && (
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
          )}

          {/* الإيرادات والمصروفات */}
          {stats && (
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
                  <QuickLink title="المشاريع" icon="🏗️" />
                  <QuickLink title="المعاملات" icon="💰" />
                  <QuickLink title="الموظفين" icon="👥" />
                  <QuickLink title="التقارير" icon="📊" />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// مكون بطاقة الإحصائيات
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
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
interface QuickLinkProps {
  title: string;
  icon: string;
}

const QuickLink: React.FC<QuickLinkProps> = ({ title, icon }) => (
  <button className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <span className="text-xl ml-3">{icon}</span>
    <span className="font-medium text-gray-700">{title}</span>
  </button>
);

export default Dashboard;
