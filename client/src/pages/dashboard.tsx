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
}

interface Project {
  id: number;
  name: string;
  balance: number;
  status?: string;
}

interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  activeProjects: number;
  adminFundBalance: number;
  recentTransactions: Transaction[];
  projects: Project[];
}

export default function Dashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (!userString) return;
    try {
      const user = JSON.parse(userString);
      setIsAdmin(user.role === 'admin');
    } catch (e) {
      setIsAdmin(false);
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
    return date.toLocaleDateString('ar-IQ');
  };

  return (
    <div className="space-y-8 py-4 fade-in">
      <div className="flex justify-between items-center pb-4 border-b border-[hsl(var(--border))]">
        <h2 className="text-xl sm:text-2xl font-bold text-[hsl(var(--primary))] slide-in-right">لوحة التحكم</h2>
        <span className="bg-[hsl(var(--primary))/10] text-[hsl(var(--primary))] text-xs px-3 py-1.5 rounded-full font-medium shadow-sm zoom-in">
          {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
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
              income={stats?.totalIncome || 0} 
              expenses={stats?.totalExpenses || 0} 
              profit={stats?.netProfit || 0}
              adminFundBalance={stats?.adminFundBalance || 0}
            />
          </div>
          
          {/* Charts Section */}
          <div className="slide-in-up" style={{animationDelay: '0.2s'}}>
            <Charts 
              income={stats?.totalIncome || 0} 
              expenses={stats?.totalExpenses || 0} 
              profit={stats?.netProfit || 0} 
            />
          </div>
          
          {/* لا نعرض أرصدة المشاريع بناءً على طلب المستخدم */}
          
          {/* Recent Transactions */}
          <div className="card mt-8 slide-in-up" style={{animationDelay: '0.4s'}}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[hsl(var(--primary))]">آخر العمليات المالية</h3>
              <Link href="/transactions" className="action-button-secondary text-sm flex items-center btn-hover-effect py-1.5 px-3">
                عرض الكل
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>
            
            {/* جدول للشاشات الكبيرة */}
            <div className="hidden md:block responsive-table-container">
              <table className="responsive-table">
                <thead className="bg-blue-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--primary))] uppercase tracking-wider">التاريخ</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--primary))] uppercase tracking-wider">الوصف</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--primary))] uppercase tracking-wider">المشروع</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--primary))] uppercase tracking-wider">النوع</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--primary))] uppercase tracking-wider">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                    stats.recentTransactions.map((transaction, index) => (
                      <tr 
                        key={transaction.id} 
                        className="hover:bg-blue-50 transition-all duration-150 slide-in-right"
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
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {transaction.type === 'income' ? 'ايراد' : 'مصروف'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-[hsl(var(--muted))]">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <path d="M3 9h18" />
                          <path d="M9 21V9" />
                        </svg>
                        لا توجد معاملات حديثة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* بطاقات للشاشات الصغيرة */}
            <div className="md:hidden space-y-4">
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.map((transaction, index) => (
                  <div 
                    key={transaction.id} 
                    className="bg-white shadow-sm border border-[hsl(var(--border))] rounded-xl p-4 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 zoom-in" 
                    style={{animationDelay: `${0.1 * (index + 1)}s`}}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{transaction.description}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      } shadow-sm`}>
                        {transaction.type === 'income' ? 'ايراد' : 'مصروف'}
                      </span>
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
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
                      <p className="mb-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        التاريخ: {formatDate(transaction.date)}
                      </p>
                    </div>
                    <div className={`mt-3 text-sm font-bold flex items-center justify-end ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
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
                  لا توجد معاملات حديثة.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
