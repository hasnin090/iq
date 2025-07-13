import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TransactionForm } from '@/components/transaction-form';
import { TransactionList } from '@/components/transaction-list';
import { TransactionLinkedDocuments } from '@/components/document-library/document-linker';
import { useCacheManager } from '@/hooks/use-cache-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, ArrowDown, ArrowUp, Search, Archive, CheckSquare, Square, Download, Printer, FileSpreadsheet, Paperclip } from 'lucide-react';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { formatCurrency } from '@/lib/chart-utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { supabaseApi } from '@/lib/supabase-api';

interface Filter {
  projectId?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export default function Transactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshTransactions } = useCacheManager();
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
    expenseType?: string;
  }

  interface Project {
    id: number;
    name: string;
  }

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', filter],
    queryFn: () => supabaseApi.getTransactions(filter),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => supabaseApi.getProjects(),
  });

  const handleFormSubmit = () => {
    // تحديث شامل للكاش بعد إنشاء معاملة جديدة
    refreshTransactions();
  };

  const [activeTab, setActiveTab] = useState<"admin" | "all" | "projects">("all");

  const archiveMutation = useMutation({
    mutationFn: (transactionIds: number[]) => supabaseApi.archiveTransactions(transactionIds),
    onSuccess: (data) => {
      toast({
        title: "تم الأرشفة بنجاح",
        description: data.message,
      });
      
      // تحديث شامل للكاش بعد الأرشفة
      refreshTransactions();
      
      setSelectedTransactions([]);
      setIsArchiveMode(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ في الأرشفة",
        description: error instanceof Error ? error.message : "فشل في أرشفة المعاملات",
      });
    },
  });

  const handleArchive = () => {
    if (selectedTransactions.length > 0) {
      archiveMutation.mutate(selectedTransactions);
    }
  }

  // وظيفة تصدير البيانات إلى Excel - مخصصة للمستخدمين من نوع المشاهدة
  const exportToExcel = async () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "لا توجد معاملات مالية متاحة للتصدير",
        variant: "destructive",
      });
      return;
    }

    // فلترة البيانات لإخفاء الإيرادات للمستخدمين من نوع المشاهدة
    const dataForExport = user?.role === 'viewer' 
      ? filteredTransactions.filter(t => t.type !== 'income')
      : filteredTransactions;

    if (dataForExport.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "لا توجد معاملات مالية متاحة للتصدير بعد تطبيق القيود",
        variant: "destructive",
      });
      return;
    }

    // تحضير البيانات للتصدير
    const exportData = dataForExport.map(transaction => {
      const project = projects?.find(p => p.id === transaction.projectId);
      const baseData = {
        'التاريخ': format(new Date(transaction.date), 'yyyy/MM/dd', { locale: ar }),
        'الوصف': transaction.description || '',
        'المشروع': project?.name || 'بدون مشروع',
        'النوع': transaction.type === 'income' ? 'إيراد' : 'مصروف',
        'نوع المصروف': transaction.expenseType || '',
        'المبلغ': transaction.amount,
        'المبلغ المنسق': formatCurrency(transaction.amount),
      };
      
      // للمستخدمين من نوع المشاهدة، إنشاء كائن بدون عمود النوع
      if (user?.role === 'viewer') {
        const { النوع, ...dataWithoutType } = baseData;
        return dataWithoutType;
      }
      
      return baseData;
    });

    // إنشاء كتاب عمل جديد باستخدام ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('المعاملات المالية');

    // إضافة البيانات
    const headers = Object.keys(exportData[0] || {});
    worksheet.addRow(headers);
    
    exportData.forEach(row => {
      worksheet.addRow(Object.values(row));
    });

    // تنسيق الأعمدة
    worksheet.columns = [
      { header: 'التاريخ', key: 'التاريخ', width: 12 },
      { header: 'الوصف', key: 'الوصف', width: 30 },
      { header: 'المشروع', key: 'المشروع', width: 20 },
      { header: 'النوع', key: 'النوع', width: 10 },
      { header: 'نوع المصروف', key: 'نوع المصروف', width: 15 },
      { header: 'المبلغ', key: 'المبلغ', width: 15 },
    ];

    // تصدير الملف
    const now = new Date();
    const dateString = format(now, 'yyyy-MM-dd-HHmmss');
    const fileName = `transactions_${dateString}.xlsx`;
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "تم التصدير بنجاح",
      description: `تم تصدير ${filteredTransactions.length} معاملة مالية إلى Excel`,
    });
  };

  // تصدير Excel محلي (بدون استخدام API)
  const handleExcelExport = () => {
    if (!transactions) return;
    
    // تطبيق الفلاتر على البيانات المحلية
    let filteredData = transactions;
    
    if (filter.projectId) {
      filteredData = filteredData.filter(t => t.projectId === filter.projectId);
    }
    
    if (filter.type) {
      filteredData = filteredData.filter(t => t.type === filter.type);
    }
    
    if (filter.startDate) {
      filteredData = filteredData.filter(t => new Date(t.date) >= new Date(filter.startDate!));
    }
    
    if (filter.endDate) {
      filteredData = filteredData.filter(t => new Date(t.date) <= new Date(filter.endDate!));
    }
    
    // استخدام دالة التصدير المحلية مع البيانات المفلترة
    exportToExcel();
  };

  // وظيفة الطباعة - مخصصة للمستخدمين من نوع المشاهدة
  const handlePrint = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      toast({
        title: "لا توجد بيانات للطباعة",
        description: "لا توجد معاملات مالية متاحة للطباعة",
        variant: "destructive",
      });
      return;
    }

    // فلترة البيانات لإخفاء الإيرادات للمستخدمين من نوع المشاهدة
    const dataForPrint = user?.role === 'viewer' 
      ? filteredTransactions.filter(t => t.type !== 'income')
      : filteredTransactions;

    if (dataForPrint.length === 0) {
      toast({
        title: "لا توجد بيانات للطباعة",
        description: "لا توجد معاملات مالية متاحة للطباعة بعد تطبيق القيود",
        variant: "destructive",
      });
      return;
    }

    // إنشاء نافذة طباعة
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = format(new Date(), 'yyyy/MM/dd', { locale: ar });
    const reportTitle = user?.role === 'viewer' ? 'تقرير المصروفات المالية' : 'تقرير المعاملات المالية';
    
    // تحديد العناوين حسب نوع المستخدم
    const headers = user?.role === 'viewer' 
      ? ['التاريخ', 'الوصف', 'المشروع', 'نوع المصروف', 'المبلغ']
      : ['التاريخ', 'الوصف', 'المشروع', 'النوع', 'نوع المصروف', 'المبلغ'];
    
    // محتوى الطباعة
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
          .header h1 { color: #2563eb; margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f8fafc; font-weight: bold; color: #374151; }
          .income { color: #059669; font-weight: bold; }
          .expense { color: #dc2626; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportTitle}</h1>
          <p>تاريخ التقرير: ${currentDate}</p>
          <p>عدد المعاملات: ${dataForPrint.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${dataForPrint.map(transaction => {
              const project = projects?.find(p => p.id === transaction.projectId);
              const cells = [
                format(new Date(transaction.date), 'yyyy/MM/dd', { locale: ar }),
                transaction.description || '',
                project?.name || 'بدون مشروع'
              ];
              
              // إضافة النوع فقط للمستخدمين غير المشاهدين
              if (user?.role !== 'viewer') {
                cells.push(`<span class="${transaction.type === 'income' ? 'income' : 'expense'}">${transaction.type === 'income' ? 'إيراد' : 'مصروف'}</span>`);
              }
              
              cells.push(transaction.expenseType || '');
              cells.push(formatCurrency(transaction.amount));
              
              return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
            }).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>نظام المحاسبة المالية - تم إنشاء التقرير في ${format(new Date(), 'yyyy/MM/dd HH:mm', { locale: ar })}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSelectAll = () => {
    if (transactions) {
      setSelectedTransactions(transactions.map(t => t.id));
    }
  };

  const handleUnselectAll = () => {
    setSelectedTransactions([]);
  };

  const toggleTransactionSelection = (transactionId: number) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let filtered = [...transactions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(query) ||
        transaction.amount.toString().includes(query) ||
        (transaction.type === 'income' && 'ايراد'.includes(query)) ||
        (transaction.type === 'expense' && 'مصروف'.includes(query)) ||
        projects?.find(p => p.id === transaction.projectId)?.name.toLowerCase().includes(query)
      );
    }
    
    return [...filtered].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [transactions, searchQuery, projects]);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="py-6 px-4 pb-mobile-nav-large">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[hsl(var(--primary))] flex items-center gap-3">
            <i className="fas fa-exchange-alt text-[hsl(var(--primary))]"></i>
            العمليات المالية
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">إدارة ومتابعة جميع المعاملات المالية في النظام</p>
        </div>
      
        {user?.role !== 'viewer' && (
          <div className="mb-8 fade-in">
            <div className="bg-[hsl(var(--card))] border border-blue-100 p-6 rounded-xl shadow-sm">
              <TransactionForm 
                projects={projects || []} 
                onSubmit={handleFormSubmit} 
                isLoading={projectsLoading}
              />
            </div>
          </div>
        )}
        
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5 rounded-xl shadow-sm fade-in">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-3">
            <h3 className="text-base font-medium text-[hsl(var(--foreground))] flex items-center gap-2">
              <Filter className="w-4 h-4" />
              عرض وفلترة المعاملات المالية
            </h3>
            
            <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
              {/* أزرار التصدير والطباعة */}
              <Button
                onClick={handleExcelExport}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <FileSpreadsheet className="w-4 h-4" />
                تصدير Excel
              </Button>
              
              {user?.role === 'viewer' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  className="flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Download className="w-4 h-4" />
                  تصدير Excel بسيط
                </Button>
              )}
              
              <Button
                onClick={() => window.print()}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Printer className="w-4 h-4" />
                طباعة
              </Button>

              {/* أزرار الأرشفة - مخفية للمستخدمين مشاهدة فقط */}
              {user?.role !== 'viewer' && (
                <>
                  <Button
                    variant={isArchiveMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsArchiveMode(!isArchiveMode)}
                    className="flex items-center gap-1 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  >
                    <Archive className="w-4 h-4" />
                    {isArchiveMode ? 'إلغاء الأرشفة' : 'وضع الأرشفة'}
                  </Button>
                  
                  {isArchiveMode && (
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        onClick={handleSelectAll}
                        className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-xs"
                      >
                        <CheckSquare className="w-3 h-3" />
                        تحديد الكل ({selectedTransactions.length})
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleUnselectAll}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Square className="w-3 h-3" />
                        إلغاء التحديد
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleArchive}
                        disabled={selectedTransactions.length === 0 || archiveMutation.isPending}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Archive className="w-3 h-3" />
                        أرشفة ({selectedTransactions.length})
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-[hsl(var(--primary))] flex items-center gap-2">
              <Search className="w-5 h-5" />
              البحث والعرض
            </h3>
            <div className="flex gap-2 mt-2 md:mt-0 w-full md:w-auto">
              <Button
                variant={currentView === 'cards' ? 'default' : 'outline'}
                onClick={() => setCurrentView('cards')}
                className={`flex-1 md:flex-none px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                  currentView === 'cards' 
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]' 
                    : 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
                }`}
              >
                عرض البطاقات
              </Button>
              <Button
                variant={currentView === 'table' ? 'default' : 'outline'}
                onClick={() => setCurrentView('table')}
                className={`flex-1 md:flex-none px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                  currentView === 'table' 
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]' 
                    : 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
                }`}
              >
                عرض الجدول
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="البحث في المعاملات المالية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="w-full">
            <TransactionList 
              transactions={filteredTransactions || []} 
              projects={projects || []} 
              viewType={currentView}
              isLoading={transactionsLoading || projectsLoading}
              onTransactionUpdated={handleFormSubmit}
              isArchiveMode={isArchiveMode}
              selectedTransactions={selectedTransactions}
              onToggleSelection={toggleTransactionSelection}
            />
          </div>
        </div>
      </div>
    </div>
  );
}