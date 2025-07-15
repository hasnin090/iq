import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { StatisticsCards } from '@/components/statistics-cards';
import { Charts } from '@/components/charts';
import Chart from 'chart.js/auto';
import { formatCurrency } from '@/lib/chart-utils';

interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: string;
  description: string;
  projectId?: number;
  fileUrl?: string;
  fileType?: string;
}

interface Project {
  id: number;
  name: string;
  balance: number;
  status?: string;
}

interface DashboardStats {
  // البيانات الإجمالية (للتوافق القديم)
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  
  // بيانات الصندوق الرئيسي
  adminTotalIncome: number;
  adminTotalExpenses: number;
  adminNetProfit: number;
  adminFundBalance: number;
  
  // بيانات المشاريع
  projectTotalIncome: number;
  projectTotalExpenses: number;
  projectNetProfit: number;
  
  // بيانات أخرى
  activeProjects: number;
  recentTransactions: Transaction[];
  projects: Project[];
}

export default function Dashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayMode, setDisplayMode] = useState<'admin' | 'projects'>('admin');
  
  useEffect(() => {
    const userString = localStorage.getItem("auth_user");
    if (!userString) return;
    
    try {
      const user = JSON.parse(userString);
      const isAdminUser = user.role === 'admin';
      
      setIsAdmin(isAdminUser);
      const mode = isAdminUser ? 'admin' : 'projects';
      setDisplayMode(mode);
    } catch (e) {
      setIsAdmin(false);
      setDisplayMode('projects');
    }
  }, []);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard'],
  });

  const getProjectName = (projectId?: number) => {
    if (!projectId || !stats?.projects) return 'عام';
    const project = stats.projects.find(p => p.id === projectId);
    return project ? project.name : 'غير معروف';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getFilteredTransactions = () => {
    if (!stats?.recentTransactions) return [];
    
    let filteredTransactions;
    
    if (displayMode === 'admin') {
      filteredTransactions = stats.recentTransactions.filter(t => t.projectId === null || t.projectId === undefined);
    } else {
      filteredTransactions = stats.recentTransactions.filter(t => 
        (t.projectId !== null && t.projectId !== undefined)
      );
    }
    
    const userString = localStorage.getItem("auth_user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user.role === 'viewer') {
          filteredTransactions = filteredTransactions.filter(t => t.type !== 'income');
        }
      } catch (e) {
        console.error("Error parsing user data for transaction filtering:", e);
      }
    }
    
    return filteredTransactions;
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="dashboard-container p-2 sm:p-4 lg:p-6 space-y-4 lg:space-y-6 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header Section */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 sm:p-6 lg:p-8">
        <div className="max-w-full mx-auto">
          <div className="flex flex-col xl:flex-row justify-between items-center gap-4 lg:gap-6">
            {/* Logo and Title Section */}
            <div className="flex items-center space-x-4 sm:space-x-6 rtl:space-x-reverse">
              <div className="relative group">
                <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-all duration-300 border border-emerald-300/50">
                  <svg className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-lg animate-pulse flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-emerald-700 via-green-600 to-teal-600 dark:from-emerald-400 dark:to-green-500 bg-clip-text text-transparent">
                  شركة طريق العامرة
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 text-base sm:text-lg font-medium">
                  لوحة التحكم المالية والإدارية المتكاملة
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">للمقاولات والاستثمار</p>
              </div>
            </div>
            
            {/* Controls Section */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 lg:gap-6 w-full xl:w-auto">
              {/* Mode Toggle for Admins */}
              {isAdmin && (
                <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg rounded-xl shadow-lg p-1 flex items-center border border-gray-200/50 dark:border-gray-600/50 w-full sm:w-auto">
                  <button
                    onClick={() => setDisplayMode('admin')}
                    className={`px-2 sm:px-3 lg:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-2 transition-all duration-300 flex-1 sm:flex-none justify-center ${
                      displayMode === 'admin'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="hidden sm:inline">الصندوق الرئيسي</span>
                    <span className="sm:hidden">الصندوق</span>
                  </button>
                  <button
                    onClick={() => setDisplayMode('projects')}
                    className={`px-2 sm:px-3 lg:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-2 transition-all duration-300 flex-1 sm:flex-none justify-center ${
                      displayMode === 'projects'
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    المشاريع
                  </button>
                </div>
              )}

              {/* Date Display */}
              <div className="bg-gradient-to-r from-sky-400 to-blue-500 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-xl shadow-lg text-white relative overflow-hidden w-full sm:w-auto">
                <div className="relative text-center">
                  <div className="text-xs sm:text-sm font-medium opacity-90 mb-1">التاريخ اليوم</div>
                  <div className="font-semibold text-sm sm:text-base">
                    {new Date().toLocaleDateString('ar-SA', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Welcome Section - شركة طريق العامرة */}
      <div className="bg-gradient-to-r from-emerald-500/90 via-green-500/90 to-teal-500/90 backdrop-blur-xl shadow-2xl border border-emerald-300/50 rounded-2xl p-6 sm:p-8 lg:p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-green-700/20"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-right flex-1">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
                مرحباً بك في شركة طريق العامرة
              </h2>
              <p className="text-lg sm:text-xl font-medium opacity-90 mb-4">
                للمقاولات والاستثمار - نحو مستقبل أفضل
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">15+</div>
                  <div className="text-sm opacity-90">سنة خبرة</div>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">200+</div>
                  <div className="text-sm opacity-90">مشروع منجز</div>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">95%</div>
                  <div className="text-sm opacity-90">رضا العملاء</div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-12 h-12 lg:w-16 lg:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">★</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="dashboard-content space-y-4 lg:space-y-6">
        
        {statsLoading ? (
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-10">
                <div className="absolute inset-0 border-8 border-blue-200 dark:border-blue-800 rounded-full animate-ping opacity-30"></div>
                <div className="absolute inset-2 border-6 border-purple-200 dark:border-purple-800 rounded-full animate-ping opacity-50 animation-delay-200"></div>
                <div className="relative w-full h-full border-8 border-t-blue-600 border-r-purple-600 border-b-indigo-600 border-l-emerald-600 rounded-full animate-spin shadow-2xl"></div>
                <div className="absolute inset-6 border-4 border-t-emerald-400 border-r-blue-400 border-b-purple-400 border-l-indigo-400 rounded-full animate-spin animation-reverse"></div>
              </div>
              <h3 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-700 to-indigo-700 dark:from-blue-400 dark:via-purple-500 dark:to-indigo-500 bg-clip-text text-transparent mb-4">
                جاري تحميل البيانات
              </h3>
              <p className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-4">يرجى الانتظار قليلاً...</p>
              <div className="flex justify-center space-x-2 rtl:space-x-reverse">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce animation-delay-200"></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce animation-delay-400"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Enhanced Statistics Cards */}
            <div className="transform hover:scale-[1.02] transition-all duration-500">
              <StatisticsCards 
                income={displayMode === 'admin' ? stats?.adminTotalIncome || 0 : stats?.projectTotalIncome || 0} 
                expenses={displayMode === 'admin' ? stats?.adminTotalExpenses || 0 : stats?.projectTotalExpenses || 0} 
                profit={displayMode === 'admin' ? stats?.adminNetProfit || 0 : stats?.projectNetProfit || 0}
                adminFundBalance={stats?.adminFundBalance || 0}
                displayMode={displayMode}
              />
            </div>
            
            {/* Enhanced Charts Section */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 lg:p-8 max-w-full overflow-hidden">
              <Charts 
                income={displayMode === 'admin' ? stats?.adminTotalIncome || 0 : stats?.projectTotalIncome || 0} 
                expenses={displayMode === 'admin' ? stats?.adminTotalExpenses || 0 : stats?.projectTotalExpenses || 0} 
                profit={displayMode === 'admin' ? stats?.adminNetProfit || 0 : stats?.projectNetProfit || 0}
                displayMode={displayMode}
              />
            </div>
            
            {/* Enhanced Recent Transactions */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 lg:p-8 max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className={`text-2xl lg:text-3xl font-bold bg-gradient-to-r ${
                    displayMode === 'admin' 
                      ? 'from-blue-600 to-indigo-700 dark:from-blue-400 dark:to-indigo-500'
                      : 'from-emerald-600 to-green-700 dark:from-emerald-400 dark:to-green-500'
                  } bg-clip-text text-transparent mb-2`}>
                    {displayMode === 'admin' 
                      ? 'آخر عمليات الصندوق الرئيسي'
                      : 'آخر عمليات المشاريع'
                    }
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-base">عرض أحدث 10 معاملات مالية</p>
                </div>
                <Link 
                  href="/transactions" 
                  className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  <span>عرض الكل</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              {/* Desktop Table */}
              <div className="dashboard-table hidden lg:block overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                <table className="w-full table-auto divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  <thead className={`${
                    displayMode === 'admin' 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20' 
                      : 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20'
                  }`}>
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">التاريخ</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الوصف</th>
                      {displayMode === 'projects' && (
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">المشروع</th>
                      )}
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">النوع</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">المبلغ</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">المرفقات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200/30 dark:divide-gray-700/30">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.slice(0, 10).map((transaction, index) => (
                        <tr 
                          key={transaction.id} 
                          className={`hover:bg-gradient-to-r transition-all duration-200 ${
                            displayMode === 'admin' 
                              ? 'hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20' 
                              : 'hover:from-emerald-50/50 hover:to-green-50/50 dark:hover:from-emerald-900/20 dark:hover:to-green-900/20'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium truncate">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium truncate">
                            <div className="truncate" title={transaction.description}>
                              {transaction.description}
                            </div>
                          </td>
                          {displayMode === 'projects' && (
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-medium truncate block">
                                {getProjectName(transaction.projectId)}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 inline-flex text-xs font-bold rounded shadow-sm ${
                              transaction.type === 'income' 
                                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' 
                                : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                            }`}>
                              {transaction.type === 'income' ? 'إيراد' : 'مصروف'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-center">
                            <div className={`truncate ${
                              transaction.type === 'income' 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`} title={`${transaction.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount))}`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {transaction.fileUrl ? (
                              <button 
                                onClick={() => window.open(transaction.fileUrl, '_blank')}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded text-xs font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-sm hover:scale-105"
                                title="عرض المرفق"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                              </button>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={displayMode === 'projects' ? 6 : 5} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h4 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">لا توجد معاملات</h4>
                            <p className="text-gray-400 dark:text-gray-500">
                              {displayMode === 'admin' 
                                ? 'لا توجد معاملات حديثة في الصندوق الرئيسي'
                                : 'لا توجد معاملات حديثة للمشاريع'
                              }
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.slice(0, 8).map((transaction, index) => (
                    <div 
                      key={transaction.id} 
                      className={`bg-gradient-to-r p-6 rounded-2xl shadow-xl border transform hover:scale-105 transition-all duration-300 ${
                        displayMode === 'admin' 
                          ? 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-700/50' 
                          : 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">{transaction.description}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(transaction.date)}</p>
                          {displayMode === 'projects' && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              المشروع: {getProjectName(transaction.projectId)}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 text-sm font-bold rounded-lg shadow-sm ${
                          transaction.type === 'income' 
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' 
                            : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                        }`}>
                          {transaction.type === 'income' ? 'إيراد' : 'مصروف'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`text-xl font-bold ${
                          transaction.type === 'income' 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                        </span>
                        
                        {transaction.fileUrl && (
                          <button 
                            onClick={() => window.open(transaction.fileUrl, '_blank')}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:scale-105 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span>مرفق</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <svg className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h4 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">لا توجد معاملات</h4>
                    <p className="text-gray-400 dark:text-gray-500">
                      {displayMode === 'admin' 
                        ? 'لا توجد معاملات حديثة في الصندوق الرئيسي'
                        : 'لا توجد معاملات حديثة للمشاريع'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer - شركة طريق العامرة */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-white rounded-2xl p-6 mt-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">شركة طريق العامرة للمقاولات والاستثمار</h3>
          </div>
          <p className="text-gray-300 text-sm mb-2">
            نظام إدارة مالي متكامل ومتطور | جميع الحقوق محفوظة © 2025
          </p>
          <p className="text-gray-400 text-xs">
            تم التطوير بأحدث التقنيات لضمان أفضل أداء وأمان
          </p>
        </div>
      </div>
    </div>
  );
}