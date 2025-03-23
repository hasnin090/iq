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
    <div className="space-y-8 py-6">
      <h2 className="text-2xl font-bold text-primary-light pb-2 border-b border-neutral-dark border-opacity-20">لوحة التحكم</h2>
      
      {statsLoading ? (
        <div className="text-center py-20">
          <div className="spinner w-8 h-8 mx-auto"></div>
          <p className="mt-4 text-muted">جاري تحميل البيانات...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <StatisticsCards 
            income={stats?.totalIncome || 0} 
            expenses={stats?.totalExpenses || 0} 
            profit={stats?.netProfit || 0} 
          />
          
          {/* Charts Section */}
          <Charts 
            income={stats?.totalIncome || 0} 
            expenses={stats?.totalExpenses || 0} 
            profit={stats?.netProfit || 0} 
          />
          
          {/* Recent Transactions */}
          <div className="bg-secondary-light rounded-xl shadow-card p-6 mt-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-primary-light">آخر العمليات المالية</h3>
              <Link href="/transactions" className="text-primary-light text-sm hover:underline">
                عرض الكل
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary">
                <thead>
                  <tr>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">التاريخ</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الوصف</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">المشروع</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">النوع</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-light">
                  {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                    stats.recentTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-light">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-light">
                          {transaction.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-light">
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
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        لا توجد معاملات حديثة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
