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
  
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions', filter],
    queryFn: async ({ queryKey }) => {
      const [_, filterParams] = queryKey;
      const params = new URLSearchParams();
      
      if (filterParams.projectId) params.append('projectId', String(filterParams.projectId));
      if (filterParams.type) params.append('type', filterParams.type);
      
      const response = await fetch(`/api/transactions?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    }
  });
  
  const { data: projects, isLoading: projectsLoading } = useQuery({
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
    <div className="space-y-8 py-6">
      <h2 className="text-2xl font-bold text-primary-light pb-2 border-b border-neutral-dark border-opacity-20">إدارة الحسابات</h2>
      
      {/* Transaction Form */}
      <TransactionForm 
        projects={projects || []} 
        onSubmit={handleFormSubmit} 
        isLoading={projectsLoading}
      />
      
      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-neutral mb-1" htmlFor="filterProject">المشروع</label>
            <select 
              id="filterProject" 
              className="px-4 py-2 rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
              onChange={(e) => handleFilterChange({ projectId: e.target.value ? parseInt(e.target.value) : undefined })}
              value={filter.projectId || ''}
            >
              <option value="">كل المشاريع</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral mb-1" htmlFor="filterType">نوع العملية</label>
            <select 
              id="filterType" 
              className="px-4 py-2 rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
              onChange={(e) => handleFilterChange({ type: e.target.value || undefined })}
              value={filter.type || ''}
            >
              <option value="">الكل</option>
              <option value="income">ايراد</option>
              <option value="expense">مصروف</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 self-end mt-6 md:mt-0">
          <button 
            className={`px-3 py-2 bg-secondary rounded-lg text-neutral-light border border-secondary-light hover:border-primary-light transition-all ${currentView === 'cards' ? 'border-primary-light' : ''}`}
            onClick={() => setCurrentView('cards')}
          >
            <i className="fas fa-th"></i> عرض البطاقات
          </button>
          <button 
            className={`px-3 py-2 bg-secondary rounded-lg text-neutral-light border border-secondary-light hover:border-primary-light transition-all ${currentView === 'table' ? 'border-primary-light' : ''}`}
            onClick={() => setCurrentView('table')}
          >
            <i className="fas fa-list"></i> عرض الجدول
          </button>
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
  );
}
