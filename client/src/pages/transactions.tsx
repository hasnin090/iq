import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TransactionForm } from '@/components/transaction-form';
import { TransactionList } from '@/components/transaction-list';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, ArrowDown, ArrowUp, Search, Archive, CheckSquare, Square } from 'lucide-react';
import { formatCurrency } from '@/lib/chart-utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface Filter {
  projectId?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export default function Transactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>({});
  const [currentView, setCurrentView] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [isArchiveMode, setIsArchiveMode] = useState(false);
  
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

  // دالة الأرشفة اليدوية
  const archiveMutation = useMutation({
    mutationFn: async (transactionIds: number[]) => {
      const response = await fetch('/api/transactions/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionIds }),
      });
      if (!response.ok) throw new Error('فشل في أرشفة المعاملات');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الأرشفة بنجاح",
        description: `تم أرشفة ${selectedTransactions.length} معاملة بنجاح`,
      });
      setSelectedTransactions([]);
      setIsArchiveMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/archive'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الأرشفة",
        description: error.message || "حدث خطأ أثناء أرشفة المعاملات",
        variant: "destructive",
      });
    },
  });

  // دوال التحديد
  const toggleTransactionSelection = (transactionId: number) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const selectAllTransactions = () => {
    const allIds = filteredTransactions.map(t => t.id);
    setSelectedTransactions(allIds);
  };

  const clearSelection = () => {
    setSelectedTransactions([]);
  };

  const handleArchiveSelected = () => {
    if (selectedTransactions.length === 0) {
      toast({
        title: "لا توجد معاملات محددة",
        description: "يرجى تحديد معاملة واحدة على الأقل للأرشفة",
        variant: "destructive",
      });
      return;
    }
    archiveMutation.mutate(selectedTransactions);
  };
  
  // تعيين التبويب الافتراضي حسب دور المستخدم
  const defaultTab = user?.role === 'admin' ? 'all' : 'projects';
  const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'projects'>(defaultTab);
  
  // دالة للحصول على اسم المشروع
  const getProjectName = (projectId?: number): string => {
    if (!projectId) return 'الصندوق الرئيسي';
    const project = projects?.find(p => p.id === projectId);
    return project?.name || `مشروع رقم ${projectId}`;
  };

  // فلترة العمليات المالية حسب التبويب النشط والبحث
  const filteredTransactions = useMemo(() => {
    // أولاً نقوم بفلترة المعاملات حسب التبويب النشط
    let filtered = [];
    if (activeTab === 'all') {
      filtered = transactions || [];
    } else if (activeTab === 'admin') {
      // للصندوق الرئيسي: عرض جميع المعاملات التي ليس لها مشروع
      filtered = transactions?.filter(t => t.projectId === null || t.projectId === undefined) || [];
    } else if (activeTab === 'projects') {
      // للمشاريع: عرض المعاملات المرتبطة بمشاريع
      // بالإضافة إلى عمليات الإيداع في الصندوق الرئيسي (لأنها مصدر تمويل المشاريع)
      filtered = transactions?.filter(t => 
        // المعاملات المرتبطة بمشروع
        (t.projectId !== null && t.projectId !== undefined) ||
        // أو المعاملات من نوع إيراد في الصندوق الرئيسي (تغذية الصندوق)
        (t.type === 'income' && (t.projectId === null || t.projectId === undefined))
      ) || [];
    } else {
      filtered = transactions || [];
    }

    // ثم نطبق البحث النصي
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(transaction => {
        // البحث في الوصف
        const descriptionMatch = transaction.description?.toLowerCase().includes(query);
        // البحث في اسم المشروع
        const projectName = getProjectName(transaction.projectId);
        const projectMatch = projectName.toLowerCase().includes(query);
        // البحث في نوع المعاملة
        const typeMatch = transaction.type === 'income' 
          ? 'إيراد'.includes(query) || 'ايراد'.includes(query) 
          : 'مصروف'.includes(query) || 'مصاريف'.includes(query);
        
        return descriptionMatch || projectMatch || typeMatch;
      });
    }
    
    // ثم نقوم بترتيب المعاملات بحيث تظهر الأحدث في الأعلى
    return [...filtered].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [transactions, activeTab, searchQuery, projects]);

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
            
            {/* شريط البحث وأدوات الأرشفة */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* أزرار الأرشفة */}
              {!isArchiveMode ? (
                <Button
                  onClick={() => setIsArchiveMode(true)}
                  variant="outline"
                  className="flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                >
                  <Archive className="h-4 w-4" />
                  أرشفة يدوية
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleArchiveSelected}
                    disabled={selectedTransactions.length === 0 || archiveMutation.isPending}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                  >
                    <Archive className="h-4 w-4" />
                    أرشفة ({selectedTransactions.length})
                  </Button>
                  <Button
                    onClick={selectAllTransactions}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <CheckSquare className="h-4 w-4" />
                    تحديد الكل
                  </Button>
                  <Button
                    onClick={clearSelection}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Square className="h-4 w-4" />
                    إلغاء التحديد
                  </Button>
                  <Button
                    onClick={() => {
                      setIsArchiveMode(false);
                      setSelectedTransactions([]);
                    }}
                    variant="outline"
                  >
                    إلغاء
                  </Button>
                </div>
              )}
              
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ابحث في الوصف أو المشروع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
              <div className="w-full md:w-auto">
                {/* استخدام قائمة منسدلة لاختيار نوع العمليات المالية */}
                <Select 
                  defaultValue={defaultTab}
                  onValueChange={(value) => setActiveTab(value as 'all' | 'admin' | 'projects')}
                >
                <SelectTrigger className="w-full md:w-56 h-10 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {activeTab === 'all' && <Filter className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
                      {activeTab === 'admin' && <ArrowUp className="h-4 w-4 text-blue-500 dark:text-blue-400" />}
                      {activeTab === 'projects' && <ArrowDown className="h-4 w-4 text-green-500 dark:text-green-400" />}
                      <SelectValue placeholder="اختر نوع العمليات" className="text-sm font-medium" />
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] shadow-md rounded-lg">
                  {/* إظهار خيار "الكل" للمدير فقط */}
                  {user?.role === 'admin' && (
                    <SelectItem 
                      value="all" 
                      className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-[hsl(var(--muted-foreground))] ml-2" />
                        <span className="font-medium text-[hsl(var(--foreground))]">جميع العمليات المالية</span>
                      </div>
                    </SelectItem>
                  )}
                  
                  {/* إظهار خيار "الصندوق الرئيسي" للمدير فقط */}
                  {user?.role === 'admin' && (
                    <SelectItem 
                      value="admin" 
                      className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-4 w-4 text-blue-500 dark:text-blue-400 ml-2" />
                        <span className="font-medium text-blue-700 dark:text-blue-400">عمليات الصندوق الرئيسي</span>
                      </div>
                    </SelectItem>
                  )}
                  
                  {/* خيار "المشاريع" مرئي للجميع */}
                  <SelectItem 
                    value="projects" 
                    className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4 text-green-500 dark:text-green-400 ml-2" />
                      <span className="font-medium text-green-700 dark:text-green-400">عمليات المشاريع</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              </div>
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

          {/* أزرار الأرشفة اليدوية */}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  الأرشفة اليدوية
                </span>
                {selectedTransactions.length > 0 && (
                  <span className="bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full text-xs">
                    {selectedTransactions.length} محدد
                  </span>
                )}
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => setIsArchiveMode(!isArchiveMode)}
                  className={`flex-1 md:flex-none px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                    isArchiveMode 
                      ? 'bg-orange-600 text-white border-orange-600' 
                      : 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30'
                  }`}
                >
                  {isArchiveMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  <span>{isArchiveMode ? 'إنهاء التحديد' : 'بدء التحديد'}</span>
                </button>
                
                {isArchiveMode && (
                  <>
                    <button
                      onClick={selectAllTransactions}
                      className="flex-1 md:flex-none px-3 py-2 rounded-lg text-sm font-medium border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>تحديد الكل</span>
                    </button>
                    <button
                      onClick={clearSelection}
                      className="flex-1 md:flex-none px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      <span>إلغاء التحديد</span>
                    </button>
                    <button
                      onClick={handleArchiveSelected}
                      disabled={selectedTransactions.length === 0 || archiveMutation.isPending}
                      className="flex-1 md:flex-none px-3 py-2 rounded-lg text-sm font-medium border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {archiveMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                      <span>أرشفة المحدد</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

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
                isArchiveMode={isArchiveMode}
                selectedTransactions={selectedTransactions}
                onToggleSelection={toggleTransactionSelection}
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
                isArchiveMode={isArchiveMode}
                selectedTransactions={selectedTransactions}
                onToggleSelection={toggleTransactionSelection}
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
              isArchiveMode={isArchiveMode}
              selectedTransactions={selectedTransactions}
              onToggleSelection={toggleTransactionSelection}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
