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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      {/* Professional Header with Glass Effect */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Logo and Title Section */}
            <div className="flex items-center space-x-8 rtl:space-x-reverse">
              <div className="relative group">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-blue-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 21l4-7 4 7M3 7l18 0M8 7l0-4M16 7l0-4" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-3 border-white shadow-lg animate-pulse flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border-2 border-white shadow-md"></div>
              </div>
              <div>
                <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-slate-900 via-blue-700 to-purple-700 dark:from-slate-100 dark:via-blue-300 dark:to-purple-300 bg-clip-text text-transparent drop-shadow-sm">
                  لوحة التحكم
                </h1>
                <p className="text-gray-700 dark:text-gray-200 mt-2 text-xl font-medium">نظرة شاملة على الأداء المالي والتشغيلي</p>
                <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span>النظام متصل</span>
                </div>
              </div>
            </div>
            
            {/* Controls Section */}
            <div className="flex items-center gap-6">
              {/* Mode Toggle for Admins */}
              {isAdmin && (
                <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg rounded-3xl shadow-2xl p-3 flex items-center border border-gray-200/50 dark:border-gray-600/50 gap-2">
                  <button
                    onClick={() => setDisplayMode('admin')}
                    className={`px-6 py-4 rounded-2xl text-base font-bold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 ${
                      displayMode === 'admin'
                        ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-2xl scale-105'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    الصندوق الرئيسي
                  </button>
                  <button
                    onClick={() => setDisplayMode('projects')}
                    className={`px-6 py-4 rounded-2xl text-base font-bold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 ${
                      displayMode === 'projects'
                        ? 'bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 text-white shadow-2xl scale-105'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    المشاريع
                  </button>
                </div>
              )}

              {/* Date Display */}
              <div className="bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 text-white px-8 py-4 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                <div className="text-center">
                  <div className="text-lg font-bold opacity-95 mb-1">اليوم</div>
                  <div className="text-2xl font-black">
                    {new Date().toLocaleDateString('ar-SA', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short'
                    })}
                  </div>
                  <div className="text-sm opacity-80 mt-1">
                    {new Date().getFullYear()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content with Enhanced Spacing */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
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
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 transform hover:scale-[1.01] transition-all duration-500">
              <Charts 
                income={displayMode === 'admin' ? stats?.adminTotalIncome || 0 : stats?.projectTotalIncome || 0} 
                expenses={displayMode === 'admin' ? stats?.adminTotalExpenses || 0 : stats?.projectTotalExpenses || 0} 
                profit={displayMode === 'admin' ? stats?.adminNetProfit || 0 : stats?.projectNetProfit || 0}
                displayMode={displayMode}
              />
            </div>
            
            {/* Enhanced Recent Transactions */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 transform hover:scale-[1.01] transition-all duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                <div>
                  <h3 className={`text-4xl lg:text-5xl font-black bg-gradient-to-r ${
                    displayMode === 'admin' 
                      ? 'from-blue-600 via-indigo-700 to-purple-700 dark:from-blue-400 dark:via-indigo-500 dark:to-purple-500'
                      : 'from-emerald-600 via-green-700 to-teal-700 dark:from-emerald-400 dark:via-green-500 dark:to-teal-500'
                  } bg-clip-text text-transparent mb-3 drop-shadow-sm`}>
                    {displayMode === 'admin' 
                      ? 'آخر عمليات الصندوق الرئيسي'
                      : 'آخر عمليات المشاريع'
                    }
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-xl font-medium">عرض أحدث 10 معاملات مالية</p>
                  <div className="flex items-center mt-2 text-base text-gray-500 dark:text-gray-400">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      displayMode === 'admin' ? 'bg-blue-500' : 'bg-green-500'
                    } animate-pulse`}></div>
                    <span>تحديث تلقائي</span>
                  </div>
                </div>
                <Link 
                  href="/transactions" 
                  className="bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-700 hover:from-blue-600 hover:via-purple-700 hover:to-indigo-800 text-white px-8 py-4 rounded-3xl text-lg font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
                >
                  <span>عرض جميع المعاملات</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  <thead className={`${
                    displayMode === 'admin' 
                      ? 'bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/40 dark:via-indigo-900/40 dark:to-purple-900/40' 
                      : 'bg-gradient-to-r from-emerald-100 via-green-100 to-teal-100 dark:from-emerald-900/40 dark:via-green-900/40 dark:to-teal-900/40'
                  }`}>
                    <tr>
                      <th className="px-8 py-6 text-right text-lg font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">التاريخ</th>
                      <th className="px-8 py-6 text-right text-lg font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">الوصف</th>
                      {displayMode === 'projects' && (
                        <th className="px-8 py-6 text-right text-lg font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">المشروع</th>
                      )}
                      <th className="px-8 py-6 text-right text-lg font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">النوع</th>
                      <th className="px-8 py-6 text-right text-lg font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">المبلغ</th>
                      <th className="px-8 py-6 text-right text-lg font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">المرفقات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200/30 dark:divide-gray-700/30">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.slice(0, 10).map((transaction, index) => (
                        <tr 
                          key={transaction.id} 
                          className={`hover:bg-gradient-to-r transition-all duration-300 transform hover:scale-[1.01] ${
                            displayMode === 'admin' 
                              ? 'hover:from-blue-50/70 hover:to-indigo-50/70 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30' 
                              : 'hover:from-emerald-50/70 hover:to-green-50/70 dark:hover:from-emerald-900/30 dark:hover:to-green-900/30'
                          }`}
                        >
                          <td className="px-8 py-6 whitespace-nowrap text-base text-gray-900 dark:text-gray-100 font-bold">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-8 py-6 text-base text-gray-900 dark:text-gray-100 font-semibold max-w-xs">
                            {transaction.description}
                          </td>
                          {displayMode === 'projects' && (
                            <td className="px-8 py-6 text-base text-gray-700 dark:text-gray-300">
                              <span className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 px-4 py-2 rounded-2xl text-sm font-bold">
                                {getProjectName(transaction.projectId)}
                              </span>
                            </td>
                          )}
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className={`px-6 py-3 inline-flex text-lg leading-5 font-black rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 ${
                              transaction.type === 'income' 
                                ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white' 
                                : 'bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white'
                            }`}>
                              {transaction.type === 'income' ? 'إيراد' : 'مصروف'}
                            </span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap text-xl font-black">
                            <span className={`${
                              transaction.type === 'income' 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                            </span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap text-base">
                            {transaction.fileUrl ? (
                              <button 
                                onClick={() => window.open(transaction.fileUrl, '_blank')}
                                className="bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 text-white px-4 py-3 rounded-2xl text-base font-bold hover:from-blue-600 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl transform hover:scale-105 flex items-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span>عرض</span>
                              </button>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400 text-lg font-medium text-center block">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={displayMode === 'projects' ? 6 : 5} className="px-6 py-16 text-center">
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
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="font-black text-xl text-gray-900 dark:text-gray-100 mb-2">{transaction.description}</h4>
                          <p className="text-base text-gray-700 dark:text-gray-300 font-semibold">{formatDate(transaction.date)}</p>
                          {displayMode === 'projects' && (
                            <p className="text-base text-gray-600 dark:text-gray-400 mt-2 font-medium">
                              المشروع: {getProjectName(transaction.projectId)}
                            </p>
                          )}
                        </div>
                        <span className={`px-4 py-2 text-base font-black rounded-2xl shadow-lg ${
                          transaction.type === 'income' 
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' 
                            : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                        }`}>
                          {transaction.type === 'income' ? 'إيراد' : 'مصروف'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`text-3xl font-black ${
                          transaction.type === 'income' 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                        </span>
                        
                        {transaction.fileUrl && (
                          <button 
                            onClick={() => window.open(transaction.fileUrl, '_blank')}
                            className="bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 text-white px-4 py-3 rounded-2xl text-base font-bold hover:from-blue-600 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl transform hover:scale-105 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
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
    </div>
  );
}