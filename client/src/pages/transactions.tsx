import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TransactionForm } from '@/components/transaction-form';
import { TransactionList } from '@/components/transaction-list';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, ArrowDown, ArrowUp } from 'lucide-react';
import { formatCurrency } from '@/lib/chart-utils';
import { useAuth } from '@/hooks/use-auth';

interface Filter {
  projectId?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export default function Transactions() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>({});
  const [currentView, setCurrentView] = useState<'cards' | 'table'>('cards');
  
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

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', filter],
    queryFn: async ({ queryKey }) => {
      const [_, filterParams] = queryKey as [string, Filter];
      const params = new URLSearchParams();
      
      if (filterParams.projectId) params.append('projectId', String(filterParams.projectId));
      if (filterParams.type) params.append('type', filterParams.type);
      
      const response = await fetch(`/api/transactions?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    }
  });
  
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  const handleFilterChange = (newFilter: Partial<Filter>) => {
    setFilter({ ...filter, ...newFilter });
  };
  
  const handleFormSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
  };
  
  // تعيين التبويب الافتراضي حسب دور المستخدم
  const defaultTab = user?.role === 'admin' ? 'all' : 'projects';
  const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'projects'>(defaultTab);
  
  // فلترة العمليات المالية حسب التبويب النشط
  const filteredTransactions = useMemo(() => {
    if (activeTab === 'all') return transactions;
    if (activeTab === 'admin') {
      // للصندوق الرئيسي: عرض جميع المعاملات التي ليس لها مشروع
      return transactions?.filter(t => t.projectId === null || t.projectId === undefined) || [];
    }
    if (activeTab === 'projects') {
      // للمشاريع: عرض المعاملات المرتبطة بمشاريع
      // بالإضافة إلى عمليات الإيداع في الصندوق الرئيسي (لأنها مصدر تمويل المشاريع)
      return transactions?.filter(t => 
        // المعاملات المرتبطة بمشروع
        (t.projectId !== null && t.projectId !== undefined) ||
        // أو المعاملات من نوع إيراد في الصندوق الرئيسي (تغذية الصندوق)
        (t.type === 'income' && (t.projectId === null || t.projectId === undefined))
      ) || [];
    }
    return transactions;
  }, [transactions, activeTab]);

  return (
    <div className="py-6 px-4 pb-mobile-nav-large">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--primary))]">إدارة الحسابات</h2>
        <p className="text-[hsl(var(--muted-foreground))] mt-2">إدارة المعاملات المالية للإيرادات والمصروفات</p>
      </div>
      
      {user?.role !== 'viewer' && (
        <div className="mb-8 fade-in">
          {/* Transaction Form - Now occupies full width at the top */}
          <div className="bg-[hsl(var(--card))] border border-blue-100 p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold text-[hsl(var(--primary))] mb-5 flex items-center space-x-2 space-x-reverse">
              <i className="fas fa-plus-circle text-[hsl(var(--primary))]"></i>
              <span>إضافة معاملة جديدة</span>
            </h3>
            <TransactionForm 
              projects={projects || []} 
              onSubmit={handleFormSubmit} 
              isLoading={projectsLoading}
            />
          </div>
        </div>
      )}
      
      {/* تبويبات العمليات المالية - تم تحسين التنسيق */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5 rounded-xl shadow-sm fade-in">
        <Tabs defaultValue={defaultTab} onValueChange={(value) => setActiveTab(value as 'all' | 'admin' | 'projects')}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
            <h3 className="text-xl font-bold text-[hsl(var(--primary))] flex items-center space-x-2 space-x-reverse">
              <i className="fas fa-exchange-alt text-[hsl(var(--primary))]"></i>
              <span>العمليات المالية</span>
            </h3>
            <div className="w-full md:w-auto">
              {/* استخدام قائمة منسدلة لاختيار نوع العمليات المالية */}
              <Select 
                defaultValue={defaultTab}
                onValueChange={(value) => setActiveTab(value as 'all' | 'admin' | 'projects')}
              >
                <SelectTrigger className="w-full md:w-56 h-10 rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {activeTab === 'all' && <Filter className="h-4 w-4 text-slate-500" />}
                      {activeTab === 'admin' && <ArrowUp className="h-4 w-4 text-blue-500" />}
                      {activeTab === 'projects' && <ArrowDown className="h-4 w-4 text-green-500" />}
                      <SelectValue placeholder="اختر نوع العمليات" className="text-sm font-medium" />
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 shadow-md rounded-lg">
                  {/* إظهار خيار "الكل" للمدير فقط */}
                  {user?.role === 'admin' && (
                    <SelectItem 
                      value="all" 
                      className="hover:bg-slate-50 transition-colors py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-500 ml-2" />
                        <span className="font-medium">جميع العمليات المالية</span>
                      </div>
                    </SelectItem>
                  )}
                  
                  {/* إظهار خيار "الصندوق الرئيسي" للمدير فقط */}
                  {user?.role === 'admin' && (
                    <SelectItem 
                      value="admin" 
                      className="hover:bg-blue-50 transition-colors py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-4 w-4 text-blue-500 ml-2" />
                        <span className="font-medium text-blue-700">عمليات الصندوق الرئيسي</span>
                      </div>
                    </SelectItem>
                  )}
                  
                  {/* خيار "المشاريع" مرئي للجميع */}
                  <SelectItem 
                    value="projects" 
                    className="hover:bg-green-50 transition-colors py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4 text-green-500 ml-2" />
                      <span className="font-medium text-green-700">عمليات المشاريع</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Filters and Controls - تم تحسين التنسيق */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-[hsl(var(--primary))] flex items-center gap-2">
              <i className="fas fa-filter text-[hsl(var(--primary))]"></i>
              <span>تصفية المعاملات</span>
            </h3>
            <div className="flex gap-2 mt-2 md:mt-0 w-full md:w-auto">
              <button 
                className={`flex-1 md:flex-none px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                  currentView === 'cards' 
                    ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]' 
                    : 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]'
                }`}
                onClick={() => setCurrentView('cards')}
              >
                <i className="fas fa-th"></i>
                <span>بطاقات</span>
              </button>
              <button 
                className={`flex-1 md:flex-none px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                  currentView === 'table' 
                    ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]' 
                    : 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]'
                }`}
                onClick={() => setCurrentView('table')}
              >
                <i className="fas fa-list"></i>
                <span>جدول</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm mt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* إظهار تصفية المشاريع فقط في تبويب "الكل" أو "المشاريع" */}
              {activeTab !== 'admin' && (
                <div className="p-2">
                  <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]" htmlFor="filterProject">
                    <i className="fas fa-project-diagram ml-1.5 text-blue-500 dark:text-blue-400"></i>
                    تصفية حسب المشروع
                  </label>
                  <select 
                    id="filterProject" 
                    className="w-full px-4 py-2.5 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:outline-none shadow-sm"
                    onChange={(e) => handleFilterChange({ projectId: e.target.value ? parseInt(e.target.value) : undefined })}
                    value={filter.projectId || ''}
                  >
                    <option value="">كل المشاريع</option>
                    {projects?.map((project: Project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="p-2">
                <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]" htmlFor="filterType">
                  <i className="fas fa-tag ml-1.5 text-green-500 dark:text-green-400"></i>
                  تصفية حسب نوع العملية
                </label>
                <select 
                  id="filterType" 
                  className="w-full px-4 py-2.5 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:outline-none shadow-sm"
                  onChange={(e) => handleFilterChange({ type: e.target.value || undefined })}
                  value={filter.type || ''}
                >
                  <option value="">كل العمليات</option>
                  <option value="income">إيرادات</option>
                  <option value="expense">مصروفات</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* محتوى التبويبات */}
          {/* محتوى تبويب "الكل" - يظهر للمدير فقط */}
          {user?.role === 'admin' && (
            <TabsContent value="all" className="pt-4">
              <div className="mb-4 px-1">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  جميع العمليات المالية
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  عرض كافة العمليات المالية في النظام
                </p>
              </div>
              <TransactionList 
                transactions={filteredTransactions || []} 
                projects={projects || []} 
                viewType={currentView}
                isLoading={transactionsLoading || projectsLoading}
                onTransactionUpdated={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
                }}
              />
            </TabsContent>
          )}
          
          {/* محتوى تبويب "الصندوق الرئيسي" - يظهر للمدير فقط */}
          {user?.role === 'admin' && (
            <TabsContent value="admin" className="pt-4">
              <div className="mb-4 px-1">
                <h3 className="text-lg font-medium text-blue-700 dark:text-blue-400 flex items-center">
                  <i className="fas fa-university ml-2"></i>
                  عمليات الصندوق الرئيسي
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  عرض العمليات المالية الخاصة بالصندوق الرئيسي فقط
                </p>
              </div>
              <TransactionList 
                transactions={filteredTransactions || []} 
                projects={projects || []} 
                viewType={currentView}
                isLoading={transactionsLoading || projectsLoading}
                onTransactionUpdated={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
                }}
              />
            </TabsContent>
          )}
          
          <TabsContent value="projects" className="pt-4">
            <div className="mb-4 px-1">
              <h3 className="text-lg font-medium text-green-700 dark:text-green-400 flex items-center">
                <i className="fas fa-project-diagram ml-2"></i>
                عمليات المشاريع
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                عرض العمليات المالية الخاصة بالمشاريع فقط
              </p>
            </div>
            <TransactionList 
              transactions={filteredTransactions || []} 
              projects={projects || []} 
              viewType={currentView}
              isLoading={transactionsLoading || projectsLoading}
              onTransactionUpdated={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
                queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
