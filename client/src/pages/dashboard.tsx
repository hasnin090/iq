import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
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
}

interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  activeProjects: number;
  recentTransactions: Transaction[];
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard'],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const getProjectName = (projectId?: number) => {
    if (!projectId || !projects) return 'عام';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'غير معروف';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-IQ');
  };

  return (
    <div className="space-y-8 py-4">
      <div className="flex justify-between items-center pb-4 border-b border-[hsl(var(--border))]">
        <h2 className="text-xl sm:text-2xl font-bold text-[hsl(var(--primary))]">لوحة التحكم</h2>
        <span className="bg-[hsl(var(--primary))/10] text-[hsl(var(--primary))] text-xs px-3 py-1.5 rounded-full font-medium">
          {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
      
      {statsLoading ? (
        <div className="text-center py-20">
          <div className="spinner w-8 h-8 mx-auto"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))]">جاري تحميل البيانات...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="fade-in">
            <StatisticsCards 
              income={stats?.totalIncome || 0} 
              expenses={stats?.totalExpenses || 0} 
              profit={stats?.netProfit || 0} 
            />
          </div>
          
          {/* Charts Section */}
          <div className="slide-in-right">
            <Charts 
              income={stats?.totalIncome || 0} 
              expenses={stats?.totalExpenses || 0} 
              profit={stats?.netProfit || 0} 
            />
          </div>
          
          {/* Recent Transactions */}
          <div className="card mt-8 fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[hsl(var(--primary))]">آخر العمليات المالية</h3>
              <Link href="/transactions" className="text-[hsl(var(--primary))] text-sm flex items-center hover:underline">
                عرض الكل
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>
            
            {/* جدول للشاشات الكبيرة */}
            <div className="hidden md:block responsive-table-container">
              <table className="responsive-table">
                <thead className="bg-[hsl(var(--muted))/50]">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--foreground))] uppercase tracking-wider">التاريخ</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--foreground))] uppercase tracking-wider">الوصف</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--foreground))] uppercase tracking-wider">المشروع</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--foreground))] uppercase tracking-wider">النوع</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--foreground))] uppercase tracking-wider">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                    stats.recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-[hsl(var(--accent))/5] transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {transaction.description}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {getProjectName(transaction.projectId)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.type === 'income' 
                              ? 'bg-success bg-opacity-20 text-success' 
                              : 'bg-destructive bg-opacity-20 text-destructive'
                          }`}>
                            {transaction.type === 'income' ? 'ايراد' : 'مصروف'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                          transaction.type === 'income' ? 'text-success' : 'text-destructive'
                        } font-bold`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
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
                stats.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="border border-[hsl(var(--border))] rounded-lg p-4 hover:bg-[hsl(var(--accent))/5] transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{transaction.description}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.type === 'income' 
                          ? 'bg-success bg-opacity-20 text-success' 
                          : 'bg-destructive bg-opacity-20 text-destructive'
                      }`}>
                        {transaction.type === 'income' ? 'ايراد' : 'مصروف'}
                      </span>
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      <p className="mb-1">المشروع: {getProjectName(transaction.projectId)}</p>
                      <p className="mb-1">التاريخ: {formatDate(transaction.date)}</p>
                    </div>
                    <div className={`mt-2 text-sm ${
                      transaction.type === 'income' ? 'text-success' : 'text-destructive'
                    } font-bold`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
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
