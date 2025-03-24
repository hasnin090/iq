import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TransactionForm } from '@/components/transaction-form';
import { TransactionList } from '@/components/transaction-list';
import { queryClient } from '@/lib/queryClient';

interface Filter {
  projectId?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export default function Transactions() {
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
  
  return (
    <div className="py-6 px-4">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--primary))]">إدارة الحسابات</h2>
        <p className="text-[hsl(var(--muted-foreground))] mt-2">إدارة المعاملات المالية للإيرادات والمصروفات</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
          {/* Transaction Form - Moved to top for mobile and desktop */}
          <div className="bg-[hsl(var(--card))] border border-blue-100 p-6 rounded-xl shadow-sm fade-in">
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
          
          {/* Filters and Controls */}
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5 rounded-xl shadow-sm fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-2">
              <h3 className="text-xl font-bold text-[hsl(var(--primary))] flex items-center space-x-2 space-x-reverse">
                <i className="fas fa-filter text-[hsl(var(--primary))]"></i>
                <span>تصفية المعاملات</span>
              </h3>
              <div className="flex gap-3">
                <button 
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center space-x-2 space-x-reverse ${
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
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center space-x-2 space-x-reverse ${
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="filterProject">تصفية حسب المشروع</label>
                <select 
                  id="filterProject" 
                  className="w-full px-4 py-2.5 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:outline-none"
                  onChange={(e) => handleFilterChange({ projectId: e.target.value ? parseInt(e.target.value) : undefined })}
                  value={filter.projectId || ''}
                >
                  <option value="">كل المشاريع</option>
                  {projects?.map((project: Project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="filterType">تصفية حسب نوع العملية</label>
                <select 
                  id="filterType" 
                  className="w-full px-4 py-2.5 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:outline-none"
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
          
          {/* Transaction List */}
          <TransactionList 
            transactions={transactions || []} 
            projects={projects || []} 
            viewType={currentView}
            isLoading={transactionsLoading || projectsLoading}
            onTransactionUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
              queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
            }}
          />
        </div>
        
        <div className="order-1 lg:order-2">
          {/* This column intentionally left empty as the TransactionForm has been moved above */}
        </div>
      </div>
    </div>
  );
}
