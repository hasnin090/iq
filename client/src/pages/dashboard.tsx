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
  // إضافة متغير لتتبع نوع العرض: 'admin' للصندوق الرئيسي و 'projects' للمشاريع
  // تحديد القيمة الافتراضية كـ 'admin' للعرض المبدئي لصندوق المدير
  const [displayMode, setDisplayMode] = useState<'admin' | 'projects'>('admin');
  
  useEffect(() => {
    const userString = localStorage.getItem("auth_user");
    console.log("Dashboard - User data from localStorage:", userString);
    
    if (!userString) return;
    
    try {
      const user = JSON.parse(userString);
      const isAdminUser = user.role === 'admin';
      console.log("Dashboard - User role:", user.role, "isAdmin:", isAdminUser);
      
      setIsAdmin(isAdminUser);
      
      // للمستخدمين العاديين، اجعل العرض الافتراضي هو المشاريع دائمًا
      // للمدراء، اجعل العرض الافتراضي هو صندوق المدير
      const mode = isAdminUser ? 'admin' : 'projects';
      console.log("Dashboard - Setting display mode to:", mode);
      setDisplayMode(mode);
    } catch (e) {
      console.error("Dashboard - Error parsing user data:", e);
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

  // دالة للحصول على المعاملات المفلترة حسب وضع العرض
  const getFilteredTransactions = () => {
    if (!stats?.recentTransactions) return [];
    
    if (displayMode === 'admin') {
      // عرض معاملات الصندوق الرئيسي فقط (بدون معرف مشروع أو projectId = null)
      return stats.recentTransactions.filter(t => t.projectId === null || t.projectId === undefined);
    } else {
      // عرض معاملات المشاريع فقط (مع وجود معرف المشروع)
      // بدون إظهار إيرادات المدير في قسم المشاريع
      return stats.recentTransactions.filter(t => 
        // المعاملات المرتبطة بمشروع محدد فقط
        (t.projectId !== null && t.projectId !== undefined)
      );
    }
  };

  // المعاملات المفلترة
  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="space-y-6 sm:space-y-8 p-responsive fade-in max-w-[1800px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center pb-4 gap-3 sm:gap-4 border-b border-[hsl(var(--border))]">
        <h2 className="heading-responsive font-bold text-[hsl(var(--primary))] slide-in-right">لوحة التحكم</h2>
        
        <div className="flex items-center gap-4">
          {/* زر التبديل بين العروض - يظهر فقط للمديرين */}
          {isAdmin ? (
            <div className="bg-[hsl(var(--card))] rounded-lg shadow-sm p-1 flex items-center">
              <button
                onClick={() => setDisplayMode('admin')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all duration-300 ${
                  displayMode === 'admin'
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                الصندوق الرئيسي
              </button>
              <button
                onClick={() => setDisplayMode('projects')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all duration-300 ${
                  displayMode === 'projects'
                    ? 'bg-green-100 text-green-700 shadow-sm'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="9" x="3" y="3" rx="1" />
                  <rect width="7" height="5" x="14" y="3" rx="1" />
                  <rect width="7" height="9" x="14" y="12" rx="1" />
                  <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
                المشاريع
              </button>
            </div>
          ) : (
            // للمستخدمين العاديين نعرض فقط عنوان المشاريع بدون أزرار تبديل
            <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
              المشاريع
            </div>
          )}

          <span className="bg-[hsl(var(--primary))/10] text-[hsl(var(--primary))] text-xs px-3 py-1.5 rounded-full font-medium shadow-sm zoom-in">
            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>
      
      {statsLoading ? (
        <div className="text-center py-20">
          <div className="spinner w-10 h-10 mx-auto border-4 border-[hsl(var(--primary))/30] border-t-[hsl(var(--primary))]"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))] animate-pulse">جاري تحميل البيانات...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="slide-in-up" style={{animationDelay: '0.1s'}}>
            <StatisticsCards 
              income={displayMode === 'admin' ? stats?.adminTotalIncome || 0 : stats?.projectTotalIncome || 0} 
              expenses={displayMode === 'admin' ? stats?.adminTotalExpenses || 0 : stats?.projectTotalExpenses || 0} 
              profit={displayMode === 'admin' ? stats?.adminNetProfit || 0 : stats?.projectNetProfit || 0}
              adminFundBalance={stats?.adminFundBalance || 0}
              displayMode={displayMode}
            />
          </div>
          
          {/* Charts Section */}
          <div className="slide-in-up" style={{animationDelay: '0.2s'}}>
            <Charts 
              income={displayMode === 'admin' ? stats?.adminTotalIncome || 0 : stats?.projectTotalIncome || 0} 
              expenses={displayMode === 'admin' ? stats?.adminTotalExpenses || 0 : stats?.projectTotalExpenses || 0} 
              profit={displayMode === 'admin' ? stats?.adminNetProfit || 0 : stats?.projectNetProfit || 0}
              displayMode={displayMode}
            />
          </div>
          
          {/* لا نعرض أرصدة المشاريع بناءً على طلب المستخدم */}
          
          {/* Recent Transactions */}
          <div className="card mt-8 slide-in-up" style={{animationDelay: '0.4s'}}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-bold ${
                displayMode === 'admin' 
                  ? 'text-blue-700 dark:text-blue-400'
                  : 'text-green-700 dark:text-green-400'
              }`}>
                {displayMode === 'admin' 
                  ? 'آخر عمليات الصندوق الرئيسي'
                  : 'آخر عمليات المشاريع'
                }
              </h3>
              <Link href="/transactions" className="action-button-secondary text-sm flex items-center btn-hover-effect py-1.5 px-3">
                عرض الكل
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>
            
            {/* جدول للشاشات الكبيرة */}
            <div className="hidden md:block responsive-table-container">
              <table className="responsive-table">
                <thead className={`${
                  displayMode === 'admin' 
                    ? 'bg-blue-50 dark:bg-blue-900/20' 
                    : 'bg-green-50 dark:bg-green-900/20'
                }`}>
                  <tr>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--primary))] uppercase tracking-wider">التاريخ</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--primary))] uppercase tracking-wider">الوصف</th>
                    {displayMode === 'projects' && (
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--primary))] uppercase tracking-wider">المشروع</th>
                    )}
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--primary))] uppercase tracking-wider">النوع</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--primary))] uppercase tracking-wider">المبلغ</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--primary))] uppercase tracking-wider">المرفقات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction, index) => (
                      <tr 
                        key={transaction.id} 
                        className={`hover:bg-slate-50 dark:hover:bg-gray-700 transition-all duration-150 slide-in-right ${
                          displayMode === 'admin' 
                            ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                            : 'hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                        style={{animationDelay: `${0.05 * (index + 1)}s`}}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 text-[hsl(var(--muted-foreground))]">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            {formatDate(transaction.date)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {transaction.description}
                        </td>
                        {displayMode === 'projects' && (
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 text-[hsl(var(--muted-foreground))]">
                                <path d="M2 17V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"/>
                                <path d="M6 12h4"/>
                                <path d="M6 8h4"/>
                                <path d="M6 16h4"/>
                              </svg>
                              {getProjectName(transaction.projectId)}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {transaction.type === 'income' ? 'ايراد' : 'مصروف'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                          transaction.type === 'income' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        } font-bold`}>
                          <div className="flex items-center justify-end">
                            {transaction.type === 'income' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                <polyline points="18 15 12 9 6 15"/>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            )}
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {transaction.fileUrl ? (
                            <button 
                              onClick={() => window.open(transaction.fileUrl, '_blank')}
                              className="text-[hsl(var(--primary))] hover:underline focus:outline-none flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 text-[hsl(var(--primary))]">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                <polyline points="14 2 14 8 20 8"/>
                              </svg>
                              عرض المرفق
                            </button>
                          ) : (
                            <span className="text-[hsl(var(--muted-foreground))] text-xs">لا يوجد</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={displayMode === 'projects' ? 6 : 5} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-[hsl(var(--muted))]">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <path d="M3 9h18" />
                          <path d="M9 21V9" />
                        </svg>
                        {displayMode === 'admin' 
                          ? 'لا توجد معاملات حديثة في الصندوق الرئيسي'
                          : 'لا توجد معاملات حديثة للمشاريع'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* بطاقات للشاشات الصغيرة */}
            <div className="md:hidden space-y-4">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction, index) => (
                  <div 
                    key={transaction.id} 
                    className={`bg-white dark:bg-gray-800 shadow-sm border rounded-xl p-4 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 zoom-in ${
                      displayMode === 'admin' 
                        ? 'border-blue-100 dark:border-blue-900/30' 
                        : 'border-green-100 dark:border-green-900/30'
                    }`}
                    style={{animationDelay: `${0.1 * (index + 1)}s`}}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm dark:text-gray-200">{transaction.description}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      } shadow-sm`}>
                        {transaction.type === 'income' ? 'ايراد' : 'مصروف'}
                      </span>
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      {displayMode === 'projects' && (
                        <p className="mb-1 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                            <path d="M2 17V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"/>
                            <path d="M12 12h4"/>
                            <path d="M12 8h4"/>
                            <path d="M12 16h4"/>
                            <path d="M6 12h2"/>
                            <path d="M6 8h2"/>
                            <path d="M6 16h2"/>
                          </svg>
                          المشروع: {getProjectName(transaction.projectId)}
                        </p>
                      )}
                      <p className="mb-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        التاريخ: {formatDate(transaction.date)}
                      </p>
                      
                      {/* عرض المرفق إذا وجد */}
                      {transaction.fileUrl && (
                        <div className="flex items-center mt-2 mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 text-[hsl(var(--primary))]">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          <button 
                            onClick={() => window.open(transaction.fileUrl, '_blank')}
                            className="text-[hsl(var(--primary))] hover:underline focus:outline-none"
                          >
                            عرض المرفق
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={`mt-3 text-sm font-bold flex items-center justify-end ${
                      transaction.type === 'income' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'income' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                          <polyline points="18 15 12 9 6 15"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      )}
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-[hsl(var(--muted))]">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                  {displayMode === 'admin' 
                    ? 'لا توجد معاملات حديثة في الصندوق الرئيسي'
                    : 'لا توجد معاملات حديثة للمشاريع'
                  }
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
