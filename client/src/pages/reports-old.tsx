import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Download, Search, Calendar, Filter, TrendingUp, TrendingDown, DollarSign, Building2, Activity, Calculator, FileSpreadsheet, Eye, AlertCircle, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { apiRequest } from '@/lib/queryClient'
import type { Transaction, Project, User } from '@/types'

// دوال مساعدة منظمة
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('د.ع.', '').trim() + ' د.ع';
};

// أنواع الحسابات المحاسبية الأساسية
const ACCOUNT_TYPES: Record<string, string> = {
  راتب: 'راتب',
  سلفة: 'سلفة', 
  مشتريات: 'مشتريات',
  'اجور تشغيلية': 'اجور تشغيلية',
  'مصروف عام': 'مصروف عام',
  وقود: 'وقود',
  كهرباء: 'كهرباء',
  ماء: 'ماء',
  اتصالات: 'اتصالات',
  صيانة: 'صيانة',
  تأمين: 'تأمين',
  ايجار: 'ايجار',
  نقل: 'نقل',
  ضرائب: 'ضرائب',
  رسوم: 'رسوم',
  تدريب: 'تدريب',
  قرطاسية: 'قرطاسية',
  تسويق: 'تسويق',
  استشارات: 'استشارات',
  'خدمات مالية': 'خدمات مالية',
  revenue: 'الإيرادات',
  general_expense: 'مصروف عام',
  other: 'متفرقات'
};

// دالة للحصول على اسم نوع الحساب
const getAccountTypeName = (accountType: string): string => {
  return ACCOUNT_TYPES[accountType] || accountType;
};

// دالة موحدة للحصول على نوع الحساب المحاسبي للمعاملة
const getTransactionAccountType = useCallback((transaction: any, expenseTypes: any[], ledgerEntries: any[]): string => {
  if (!Array.isArray(ledgerEntries) || !Array.isArray(expenseTypes)) return 'unclassified';
  
  const ledgerEntry = ledgerEntries.find((entry: any) => 
    entry.transactionId === transaction.id || entry.transaction_id === transaction.id
  );
  
  if (ledgerEntry && (ledgerEntry.expenseTypeId || ledgerEntry.expense_type_id)) {
    const expenseTypeId = ledgerEntry.expenseTypeId || ledgerEntry.expense_type_id;
    const expenseType = expenseTypes.find((type: any) => type.id === expenseTypeId);
    if (expenseType) {
      return expenseType.name;
    }
  }
  return 'unclassified';
}, []);

export default function Reports() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // حالات الفلترة والتبويب
  const [activeTab, setActiveTab] = useState('ledger');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedAccountType, setSelectedAccountType] = useState<string>('all');
  const [dialogAccountType, setDialogAccountType] = useState<string | null>(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  // طلبات البيانات الأساسية
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions']
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects']
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users']
  });

  const { data: expenseTypes = [] } = useQuery({
    queryKey: ["/api/expense-types"],
  });

  const { data: ledgerEntries = [] } = useQuery({
    queryKey: ["/api/ledger"],
  });

  const { data: deferredPayments = [] } = useQuery({
    queryKey: ["/api/deferred-payments"],
  });

  // إعادة تصنيف المعاملات
  const reclassifyTransactionsMutation = useMutation({
    mutationFn: () => apiRequest("/api/ledger/reclassify-transactions", "POST", {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ledger"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({ 
        title: "تم إعادة التصنيف بنجاح", 
        description: `تم إعادة تصنيف ${data.summary.reclassified} معاملة` 
      });
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء إعادة تصنيف المعاملات", variant: "destructive" });
    },
  });

  // فلترة المعاملات - فقط العمليات المصنفة في دفتر الأستاذ  
  const filteredTransactions = useMemo(() => {
    // تصفية المعاملات للاحتفاظ فقط بالمصنفة في دفتر الأستاذ
    const classifiedTransactions = transactions.filter(transaction => {
      if (!Array.isArray(ledgerEntries)) return false;
      return ledgerEntries.some((entry: any) => 
        (entry.transactionId === transaction.id || entry.transaction_id === transaction.id) && 
        (entry.expenseTypeId || entry.expense_type_id)
      );
    });

    return classifiedTransactions.filter(transaction => {
      const matchesSearch = (transaction.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          transaction.amount.toString().includes(searchQuery);
      
      const matchesProject = selectedProject === 'all' || transaction.projectId?.toString() === selectedProject;
      
      const transactionDate = new Date(transaction.date);
      const now = new Date();
      let matchesDate = true;
      
      if (dateFilter === 'today') {
        matchesDate = transactionDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = transactionDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = transactionDate >= monthAgo;
      }

      const accountType = getTransactionAccountType(transaction, expenseTypes, ledgerEntries);
      const matchesAccountType = selectedAccountType === 'all' || accountType === selectedAccountType;
      
      return matchesSearch && matchesProject && matchesDate && matchesAccountType;
    });
  }, [transactions, searchQuery, selectedProject, dateFilter, selectedAccountType, expenseTypes, ledgerEntries]);

  // فلترة المعاملات لحساب معين
  const getTransactionsByAccountType = useCallback((accountType: string) => {
    return filteredTransactions.filter(transaction => {
      const transactionAccountType = getTransactionAccountType(transaction, expenseTypes, ledgerEntries);
      return transactionAccountType === accountType;
    });
  }, [filteredTransactions, expenseTypes, ledgerEntries]);

  // فتح حوار المعاملات لنوع حساب معين
  const openAccountDialog = (accountType: string) => {
    setDialogAccountType(accountType);
    setAccountDialogOpen(true);
  };

  // تجميع الحسابات حسب النوع - تشمل جميع أنواع المصروفات حتى بدون معاملات
  const accountSummary = useMemo(() => {
    const summary: Record<string, { transactions: Transaction[], total: number, count: number }> = {};
    
    // إضافة جميع أنواع المصروفات من قاعدة البيانات
    if (Array.isArray(expenseTypes)) {
      expenseTypes.forEach((expenseType: any) => {
        const typeName = expenseType.name;
        if (!summary[typeName]) {
          summary[typeName] = {
            transactions: [],
            total: 0,
            count: 0
          };
        }
      });
    }
    
    // تجميع المعاملات حسب نوع الحساب
    filteredTransactions.forEach(transaction => {
      const accountType = getTransactionAccountType(transaction, expenseTypes, ledgerEntries);
      
      if (!summary[accountType]) {
        summary[accountType] = {
          transactions: [],
          total: 0,
          count: 0
        };
      }
      
      summary[accountType].transactions.push(transaction);
      summary[accountType].total += transaction.amount;
      summary[accountType].count += 1;
    });
    
    return summary;
  }, [filteredTransactions, expenseTypes, ledgerEntries]);

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netBalance = totalIncome - totalExpenses;
    
    return {
      totalIncome,
      totalExpenses,
      netBalance,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // تصدير دفتر الأستاذ إلى Excel (للمستخدمين بصلاحية العرض فقط)
  const exportLedgerToExcel = () => {
    if (!user || user.role !== 'viewer') {
      toast({
        title: "غير مصرح",
        description: "تصدير Excel متاح فقط للمستخدمين بصلاحية العرض",
        variant: "destructive"
      });
      return;
    }

    // إنشاء ورقة ملخص الحسابات
    const summaryData = Object.entries(accountSummary).map(([type, data]) => ({
      'نوع الحساب': ACCOUNT_TYPES[type as keyof typeof ACCOUNT_TYPES] || type,
      'عدد المعاملات': data.count,
      'إجمالي المبلغ (د.ع)': data.total,
      'المبلغ مُنسق': formatCurrency(data.total)
    }));

    // إنشاء ورقة تفاصيل المعاملات
    const detailsData = filteredTransactions.map(t => {
      const project = projects.find(p => p.id === t.projectId);
      // البحث عن نوع المصروف من دفتر الأستاذ
      let accountType = 'غير مصنف';
      if (Array.isArray(ledgerEntries) && Array.isArray(expenseTypes)) {
        const ledgerEntry = ledgerEntries.find((entry: any) => entry.transactionId === t.id);
        if (ledgerEntry && ledgerEntry.expenseTypeId) {
          const expenseType = expenseTypes.find((type: any) => type.id === ledgerEntry.expenseTypeId);
          if (expenseType) {
            accountType = expenseType.name;
          }
        }
      }
      return {
        'التاريخ': format(new Date(t.date), 'yyyy/MM/dd', { locale: ar }),
        'الوصف': t.description || '',
        'نوع الحساب': ACCOUNT_TYPES[accountType as keyof typeof ACCOUNT_TYPES] || accountType,
        'المشروع': project?.name || 'الصندوق الرئيسي',
        'النوع': t.type === 'income' ? 'إيراد' : 'مصروف',
        'المبلغ (د.ع)': t.amount,
        'المبلغ مُنسق': formatCurrency(t.amount)
      };
    });

    const workbook = XLSX.utils.book_new();
    
    // إضافة ورقة ملخص الحسابات
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWs, 'ملخص دفتر الأستاذ');
    
    // إضافة ورقة تفاصيل المعاملات
    const detailsWs = XLSX.utils.json_to_sheet(detailsData);
    XLSX.utils.book_append_sheet(workbook, detailsWs, 'تفاصيل المعاملات');
    
    const fileName = `دفتر-الأستاذ-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: "تم التصدير بنجاح",
      description: `تم تصدير دفتر الأستاذ (${Object.keys(accountSummary).length} حساب)`
    });
  };

  // فحص الصلاحيات - دفتر الأستاذ للمديرين فقط
  if (!user || user.role !== 'admin') {
    return (
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="py-4 md:py-6 px-3 md:px-4 pb-mobile-nav-large">
          <Card className="text-center p-8">
            <CardContent>
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold text-muted-foreground mb-2">دفتر الأستاذ العام</h2>
              <p className="text-muted-foreground">هذا القسم مخصص للمديرين فقط</p>
              <p className="text-sm text-muted-foreground mt-2">يحتوي على معلومات مالية حساسة وتحليلات شاملة</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="py-4 md:py-6 px-3 md:px-4 pb-mobile-nav-large">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[hsl(var(--primary))] flex items-center gap-2 md:gap-3">
            <Calculator className="text-[hsl(var(--primary))] w-6 h-6 md:w-8 md:h-8" />
            دفتر الأستاذ العام
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm md:text-base">تصنيف محاسبي شامل للحسابات والمعاملات المالية</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full overflow-x-auto" style={{ 
            gridTemplateColumns: `repeat(${3 + Object.keys(accountSummary).length}, minmax(120px, 1fr))` 
          }}>
            <TabsTrigger value="ledger" className="text-xs md:text-sm px-2 py-2 whitespace-nowrap">دفتر الأستاذ</TabsTrigger>
            <TabsTrigger value="summary" className="text-xs md:text-sm px-2 py-2 whitespace-nowrap">ملخص الحسابات</TabsTrigger>
            <TabsTrigger value="details" className="text-xs md:text-sm px-2 py-2 whitespace-nowrap">التفاصيل</TabsTrigger>
            {/* تبويب لكل نوع حساب */}
            {Object.keys(accountSummary).map((accountType) => (
              <TabsTrigger 
                key={accountType} 
                value={`account-type-${accountType}`}
                className="text-xs px-2 whitespace-nowrap"
              >
                <span className="truncate max-w-20">{getAccountTypeName(accountType)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* أدوات الفلترة المحاسبية */}
          <div className="bg-gradient-to-r from-muted/20 to-muted/10 rounded-lg md:rounded-xl p-2 md:p-6 border shadow-sm mt-4">
            <div className="space-y-2 md:space-y-3">
              <div className="relative">
                <Search className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 md:w-4 md:h-4" />
                <Input
                  placeholder="البحث في الوصف أو المبلغ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8 md:pr-10 text-xs md:text-sm bg-background/80 border-border/50 focus:border-primary/50 transition-colors h-8 md:h-10"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <Select value={selectedAccountType} onValueChange={setSelectedAccountType}>
                  <SelectTrigger className="w-full bg-background/80 border-border/50 text-xs md:text-sm h-8 md:h-10">
                    <SelectValue placeholder="نوع الحساب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع أنواع الحسابات</SelectItem>
                    {Object.entries(ACCOUNT_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-full bg-background/80 border-border/50 text-xs md:text-sm h-8 md:h-10">
                    <SelectValue placeholder="اختر المشروع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المشاريع</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:col-span-2 lg:col-span-1 bg-background/80 border-border/50 text-xs md:text-sm h-8 md:h-10">
                    <SelectValue placeholder="الفترة الزمنية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفترات</SelectItem>
                    <SelectItem value="today">اليوم</SelectItem>
                    <SelectItem value="week">آخر أسبوع</SelectItem>
                    <SelectItem value="month">آخر شهر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-3 pt-2 md:pt-3 border-t border-border/30">
                <Button 
                  onClick={exportLedgerToExcel} 
                  className="btn-primary flex items-center gap-1 md:gap-2 whitespace-nowrap shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto text-xs md:text-sm h-8 md:h-10 px-3 md:px-4"
                >
                  <FileSpreadsheet className="w-3 h-3 md:w-4 md:h-4" />
                  تصدير Excel
                </Button>
              </div>
            </div>
          </div>



          {/* تبويب دفتر الأستاذ - العرض المحاسبي */}
          <TabsContent value="ledger" className="space-y-6 animate-fade-in">
            {/* تحذير عدم وجود معاملات مصنفة */}
            {Object.keys(accountSummary).length === 0 && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-800 mb-2">لا توجد معاملات مصنفة</h3>
                      <p className="text-orange-700 text-sm mb-4">
                        يبدو أن المعاملات الموجودة لم يتم تصنيفها في دفتر الأستاذ بعد. 
                        لعرض التقارير، يجب أولاً تصنيف المعاملات حسب أنواع المصاريف.
                      </p>
                      <Button 
                        onClick={() => reclassifyTransactionsMutation.mutate()}
                        disabled={reclassifyTransactionsMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {reclassifyTransactionsMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            جاري التصنيف...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            تصنيف المعاملات الآن
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ملخص الحسابات المحاسبية */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {Object.entries(accountSummary).map(([accountType, data]) => (
                <Card 
                  key={accountType} 
                  className="group relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => openAccountDialog(accountType)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm md:text-lg font-bold text-[hsl(var(--primary))] flex items-center gap-2">
                      <Calculator className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="truncate">{getAccountTypeName(accountType)}</span>
                      <Eye className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="w-fit text-xs">
                        {data.count} معاملة
                      </Badge>
                      {/* إضافة عدد الدفعات المستحقة لحساب السلف */}
                      {(accountType === 'سلف' || accountType === 'سلفة') && (deferredPayments as any[]).length > 0 && (
                        <Badge variant="outline" className="w-fit text-xs text-orange-600 border-orange-300">
                          {(deferredPayments as any[]).length} مستحق
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-lg md:text-2xl font-bold text-[hsl(var(--foreground))] mb-1">
                      {formatCurrency(data.total)}
                    </div>
                    <div className="text-xs md:text-sm text-[hsl(var(--muted-foreground))]">
                      متوسط: {formatCurrency(data.total / data.count)}
                    </div>
                    {/* إضافة معلومات الدفعات المستحقة لحساب السلف */}
                    {(accountType === 'سلف' || accountType === 'سلفة') && (deferredPayments as any[]).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-muted/30">
                        <div className="text-xs text-orange-600 font-medium">
                          دفعات مستحقة: {formatCurrency((deferredPayments as any[]).reduce((sum: number, payment: any) => sum + (payment.totalAmount - payment.paidAmount), 0))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* جدول تفصيلي للحسابات */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="truncate">تفاصيل دفتر الأستاذ</span>
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  تجميع محاسبي شامل للمعاملات المالية حسب أنواع الحسابات
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 md:px-6">
                <div className="table-container mobile-archive-table">
                  <Table className="w-full text-xs md:text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center text-xs md:text-sm p-2 md:p-4 whitespace-nowrap">نوع الحساب</TableHead>
                        <TableHead className="text-center text-xs md:text-sm p-2 md:p-4 whitespace-nowrap">عدد المعاملات</TableHead>
                        <TableHead className="text-center text-xs md:text-sm p-2 md:p-4 whitespace-nowrap">إجمالي المبلغ</TableHead>
                        <TableHead className="text-center text-xs md:text-sm p-2 md:p-4 whitespace-nowrap hidden sm:table-cell">متوسط المعاملة</TableHead>
                        <TableHead className="text-center text-xs md:text-sm p-2 md:p-4 whitespace-nowrap">النسبة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(accountSummary)
                        .sort(([,a], [,b]) => b.total - a.total)
                        .map(([accountType, data]) => {
                          const percentage = ((data.total / stats.totalExpenses) * 100).toFixed(1);
                          return (
                            <TableRow key={accountType} className="hover:bg-muted/50">
                              <TableCell className="font-medium text-center text-xs md:text-sm p-2 md:p-4">
                                <div className="truncate max-w-[80px] md:max-w-none">
                                  {getAccountTypeName(accountType)}
                                </div>
                              </TableCell>
                              <TableCell className="text-center p-2 md:p-4">
                                <Badge variant="outline" className="text-xs px-1 py-0.5">{data.count}</Badge>
                              </TableCell>
                              <TableCell className="text-center font-semibold text-xs md:text-sm p-2 md:p-4">
                                <div className="truncate">
                                  {formatCurrency(data.total)}
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-xs md:text-sm p-2 md:p-4 hidden sm:table-cell">
                                <div className="truncate">
                                  {formatCurrency(data.total / data.count)}
                                </div>
                              </TableCell>
                              <TableCell className="text-center p-2 md:p-4">
                                <Badge variant="secondary" className="text-xs px-1 py-0.5">{percentage}%</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب ملخص الحسابات */}
          <TabsContent value="summary" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(accountSummary).map(([accountType, data]) => (
                <Card key={accountType} className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[hsl(var(--primary))]" />
                      {getAccountTypeName(accountType)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">إجمالي المبلغ</span>
                        <span className="font-bold text-lg">{formatCurrency(data.total)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">عدد المعاملات</span>
                        <Badge variant="outline">{data.count} معاملة</Badge>
                      </div>
                      
                      {/* إضافة قسم الدفعات المستحقة لحساب السلف */}
                      {(accountType === 'سلف' || accountType === 'سلفة') && (
                        <div className="pt-3 border-t">
                          <div className="text-xs text-[hsl(var(--muted-foreground))] mb-3 font-semibold">الدفعات المستحقة:</div>
                          {(deferredPayments as any[]).length === 0 ? (
                            <div className="text-xs text-[hsl(var(--muted-foreground))] text-center py-2">
                              لا توجد دفعات مستحقة
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {(deferredPayments as any[]).map((payment: any) => (
                                <div key={payment.id} className="text-sm p-2 bg-muted/30 rounded border">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-[hsl(var(--primary))]">{payment.beneficiaryName}</span>
                                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                      {projects.find((p: any) => p.id === payment.projectId)?.name || 'عام'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs mt-1">
                                    <span>إجمالي: {formatCurrency(payment.totalAmount)}</span>
                                    <span className="text-green-600">مدفوع: {formatCurrency(payment.paidAmount)}</span>
                                  </div>
                                  <div className="text-xs text-orange-600 mt-1">
                                    متبقي: {formatCurrency(payment.totalAmount - payment.paidAmount)}
                                  </div>
                                  {payment.dueDate && (
                                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                      الاستحقاق: {new Date(payment.dueDate).toLocaleDateString('ar-EG')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="pt-2 border-t">
                        <div className="text-xs text-[hsl(var(--muted-foreground))] mb-2">المعاملات الأخيرة:</div>
                        {data.transactions.slice(0, 3).map((transaction) => (
                          <div key={transaction.id} className="text-sm py-1 border-b border-muted/30 last:border-0">
                            <div className="flex justify-between">
                              <span className="truncate">{transaction.description}</span>
                              <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                            </div>
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">
                              {format(new Date(transaction.date), 'yyyy/MM/dd', { locale: ar })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* تبويب التفاصيل */}
          <TabsContent value="details" className="space-y-6 animate-fade-in">
            {/* بطاقات الإحصائيات المحسنة */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50/80 to-emerald-100/60 dark:from-emerald-900/20 dark:to-emerald-800/30 border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300 card-hover">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    إجمالي الإيرادات
                  </CardTitle>
                  <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-800/50 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-2xl md:text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                    {formatCurrency(stats.totalIncome)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>+12% من الشهر الماضي</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-rose-50/80 to-rose-100/60 dark:from-rose-900/20 dark:to-rose-800/30 border-rose-200/50 shadow-lg hover:shadow-xl transition-all duration-300 card-hover">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-rose-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-rose-800 dark:text-rose-200">
                    إجمالي المصروفات
                  </CardTitle>
                  <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-800/50 group-hover:scale-110 transition-transform duration-300">
                    <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-2xl md:text-3xl font-bold text-rose-900 dark:text-rose-100 mb-2">
                    {formatCurrency(stats.totalExpenses)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>+8% من الشهر الماضي</span>
                  </div>
                </CardContent>
              </Card>

              <Card className={`group relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 card-hover ${
                stats.netBalance >= 0 
                  ? 'bg-gradient-to-br from-blue-50/80 to-blue-100/60 dark:from-blue-900/20 dark:to-blue-800/30 border-blue-200/50' 
                  : 'bg-gradient-to-br from-amber-50/80 to-amber-100/60 dark:from-amber-900/20 dark:to-amber-800/30 border-amber-200/50'
              }`}>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  stats.netBalance >= 0 
                    ? 'bg-gradient-to-r from-blue-500/5 to-blue-600/5' 
                    : 'bg-gradient-to-r from-amber-500/5 to-amber-600/5'
                }`} />
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className={`text-sm font-semibold ${
                    stats.netBalance >= 0 
                      ? 'text-blue-800 dark:text-blue-200' 
                      : 'text-amber-800 dark:text-amber-200'
                  }`}>
                    صافي الرصيد
                  </CardTitle>
                  <div className={`p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-300 ${
                    stats.netBalance >= 0 
                      ? 'bg-blue-100 dark:bg-blue-800/50' 
                      : 'bg-amber-100 dark:bg-amber-800/50'
                  }`}>
                    <DollarSign className={`h-5 w-5 ${
                      stats.netBalance >= 0 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-amber-600 dark:text-amber-400'
                    }`} />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className={`text-2xl md:text-3xl font-bold mb-2 ${
                    stats.netBalance >= 0 
                      ? 'text-blue-900 dark:text-blue-100' 
                      : 'text-amber-900 dark:text-amber-100'
                  }`}>
                    {formatCurrency(Math.abs(stats.netBalance))}
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${
                    stats.netBalance >= 0 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      stats.netBalance >= 0 ? 'bg-blue-500' : 'bg-amber-500'
                    }`} />
                    <span>{stats.netBalance >= 0 ? 'رصيد موجب' : 'رصيد سالب'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-violet-50/80 to-violet-100/60 dark:from-violet-900/20 dark:to-violet-800/30 border-violet-200/50 shadow-lg hover:shadow-xl transition-all duration-300 card-hover">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-violet-800 dark:text-violet-200">
                    عدد المعاملات
                  </CardTitle>
                  <div className="p-2.5 rounded-lg bg-violet-100 dark:bg-violet-800/50 group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-2xl md:text-3xl font-bold text-violet-900 dark:text-violet-100 mb-2">
                    {stats.transactionCount}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400">
                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                    <span>+4 معاملات جديدة اليوم</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6 animate-fade-in">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-card/95 to-card/85 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-muted/30 to-muted/10 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      سجل المعاملات المالية
                    </CardTitle>
                    <CardDescription className="text-sm mt-1 text-muted-foreground">
                      عرض تفصيلي لجميع المعاملات المالية ({filteredTransactions.length} معاملة)
                    </CardDescription>
                  </div>
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                    <Activity className="h-4 w-4" />
                    {filteredTransactions.length} معاملة
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="table-container">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-b bg-gradient-to-r from-muted/50 to-muted/30 hover:bg-muted/60">
                        <TableHead className="w-24 md:w-28 text-xs md:text-sm font-semibold text-center">التاريخ</TableHead>
                        <TableHead className="min-w-[140px] text-xs md:text-sm font-semibold">الوصف</TableHead>
                        <TableHead className="w-32 md:w-36 text-xs md:text-sm font-semibold hidden md:table-cell">المشروع</TableHead>
                        <TableHead className="w-20 md:w-24 text-xs md:text-sm font-semibold text-center">النوع</TableHead>
                        <TableHead className="w-28 md:w-32 text-xs md:text-sm font-semibold text-right">المبلغ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                            لا توجد معاملات مالية وفقاً للفلاتر المحددة
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions.map((transaction, index) => {
                          const project = projects.find(p => p.id === transaction.projectId);
                          
                          return (
                            <TableRow key={`transaction-${transaction.id}-${index}`} className="hover:bg-muted/50">
                              <TableCell className="text-xs md:text-sm py-2 md:py-3">
                                <div className="font-medium">
                                  {format(new Date(transaction.date), 'MM/dd', { locale: ar })}
                                </div>
                                <div className="text-xs text-muted-foreground md:hidden">
                                  {format(new Date(transaction.date), 'yyyy', { locale: ar })}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs md:text-sm py-2 md:py-3">
                                <div className="max-w-[120px] md:max-w-xs truncate font-medium">
                                  {transaction.description}
                                </div>
                                <div className="text-xs text-muted-foreground md:hidden mt-1">
                                  {project?.name || 'الصندوق الرئيسي'}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs md:text-sm py-2 md:py-3 hidden md:table-cell">
                                {project?.name || 'الصندوق الرئيسي'}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm py-2 md:py-3">
                                <Badge 
                                  variant={transaction.type === 'income' ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {transaction.type === 'income' ? 'إيراد' : 'مصروف'}
                                </Badge>
                                <div className="text-xs text-muted-foreground lg:hidden mt-1">
                                  {(() => {
                                    let accountType = 'غير مصنف';
                                    if (Array.isArray(ledgerEntries) && Array.isArray(expenseTypes)) {
                                      const ledgerEntry = ledgerEntries.find((entry: any) => entry.transactionId === transaction.id);
                                      if (ledgerEntry && ledgerEntry.expenseTypeId) {
                                        const expenseType = expenseTypes.find((type: any) => type.id === ledgerEntry.expenseTypeId);
                                        if (expenseType) {
                                          accountType = expenseType.name;
                                        }
                                      }
                                    }
                                    return getAccountTypeName(accountType);
                                  })()}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs md:text-sm py-2 md:py-3 hidden lg:table-cell">
                                {(() => {
                                  let accountType = 'غير مصنف';
                                  if (Array.isArray(ledgerEntries) && Array.isArray(expenseTypes)) {
                                    const ledgerEntry = ledgerEntries.find((entry: any) => entry.transactionId === transaction.id);
                                    if (ledgerEntry && ledgerEntry.expenseTypeId) {
                                      const expenseType = expenseTypes.find((type: any) => type.id === ledgerEntry.expenseTypeId);
                                      if (expenseType) {
                                        accountType = expenseType.name;
                                      }
                                    }
                                  }
                                  return getAccountTypeName(accountType);
                                })()}
                              </TableCell>
                              <TableCell className={`text-right font-medium text-xs md:text-sm py-2 md:py-3 ${
                                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                <div>
                                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">تحليل المشاريع</CardTitle>
                <CardDescription className="text-sm">عرض تفصيلي لأداء كل مشروع</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map(project => {
                    const projectTransactions = filteredTransactions.filter(t => t.projectId === project.id);
                    const projectIncome = projectTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                    const projectExpenses = projectTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                    const projectBalance = projectIncome - projectExpenses;
                    
                    return (
                      <div key={project.id} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">الإيرادات</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(projectIncome)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">المصروفات</p>
                            <p className="text-lg font-bold text-red-600">{formatCurrency(projectExpenses)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">الرصيد</p>
                            <p className={`text-lg font-bold ${projectBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(Math.abs(projectBalance))}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balances" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">ملخص الأرصدة</CardTitle>
                <CardDescription className="text-sm">عرض شامل لجميع الأرصدة والمؤشرات المالية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">الملخص المالي العام</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>إجمالي الإيرادات:</span>
                          <span className="font-bold text-green-600">{formatCurrency(stats.totalIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>إجمالي المصروفات:</span>
                          <span className="font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>صافي الرصيد:</span>
                          <span className={`font-bold ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(stats.netBalance))}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">إحصائيات المعاملات</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>عدد المعاملات:</span>
                          <span className="font-bold">{stats.transactionCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>عدد المشاريع النشطة:</span>
                          <span className="font-bold">{projects.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>متوسط المعاملة:</span>
                          <span className="font-bold">
                            {stats.transactionCount > 0 
                              ? formatCurrency((stats.totalIncome + stats.totalExpenses) / stats.transactionCount)
                              : formatCurrency(0)
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويبات ديناميكية لكل نوع حساب */}
          {Object.entries(accountSummary).map(([accountType, data]) => (
            <TabsContent key={accountType} value={`account-type-${accountType}`} className="space-y-6 animate-fade-in">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-[hsl(var(--primary))]" />
                    {getAccountTypeName(accountType)}
                  </CardTitle>
                  <CardDescription>
                    عرض تفصيلي لجميع معاملات {getAccountTypeName(accountType)} ({data.count} معاملة)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* إحصائيات سريعة */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">عدد المعاملات</p>
                      <p className="text-2xl font-bold text-primary">{data.count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">إجمالي المبلغ</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(data.total)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">متوسط المعاملة</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(data.total / data.count)}</p>
                    </div>
                  </div>

                  {/* جدول المعاملات */}
                  <div className="table-container mobile-archive-table">
                    <Table className="w-full text-xs md:text-sm">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">التاريخ</TableHead>
                          <TableHead className="text-center">الوصف</TableHead>
                          <TableHead className="text-center">المشروع</TableHead>
                          <TableHead className="text-center">المبلغ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getTransactionsByAccountType(accountType).map((transaction) => {
                          const project = projects.find(p => p.id === transaction.projectId);
                          return (
                            <TableRow key={transaction.id} className="hover:bg-muted/50">
                              <TableCell className="text-center">
                                {format(new Date(transaction.date), 'yyyy/MM/dd', { locale: ar })}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="truncate max-w-[150px]">
                                  {transaction.description || 'لا يوجد وصف'}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="truncate max-w-[100px]">
                                  {project?.name || 'الصندوق الرئيسي'}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                  {formatCurrency(transaction.amount)}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* حوار عرض المعاملات لنوع حساب معين */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
              معاملات {dialogAccountType ? getAccountTypeName(dialogAccountType) : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh] sm:max-h-[60vh]">
            {dialogAccountType && (
              <div className="space-y-4">
                {/* إحصائيات سريعة */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">عدد المعاملات</p>
                    <p className="text-xl font-bold text-primary">
                      {getTransactionsByAccountType(dialogAccountType).length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">إجمالي المبلغ</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(
                        getTransactionsByAccountType(dialogAccountType).reduce(
                          (sum, t) => sum + Math.abs(t.amount), 0
                        )
                      )}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">متوسط المعاملة</p>
                    <p className="text-xl font-bold text-primary">
                      {getTransactionsByAccountType(dialogAccountType).length > 0
                        ? formatCurrency(
                            getTransactionsByAccountType(dialogAccountType).reduce(
                              (sum, t) => sum + Math.abs(t.amount), 0
                            ) / getTransactionsByAccountType(dialogAccountType).length
                          )
                        : formatCurrency(0)
                      }
                    </p>
                  </div>
                </div>

                {/* قسم الدفعات المستحقة لحساب السلف */}
                {(dialogAccountType === 'سلف' || dialogAccountType === 'سلفة') && (deferredPayments as any[]).length > 0 && (
                  <div className="border rounded-lg overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/30 p-4 border-b">
                      <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        الدفعات المستحقة - مصنفة حسب المستفيد
                      </h3>
                      <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                        إجمالي المبلغ المتبقي: {formatCurrency((deferredPayments as any[]).reduce((sum: number, payment: any) => sum + (payment.totalAmount - payment.paidAmount), 0))}
                      </p>
                    </div>
                    <div className="p-4 space-y-4">
                      {(deferredPayments as any[]).map((payment: any) => (
                        <div key={payment.id} className="border rounded-lg p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-lg text-primary">{payment.beneficiaryName}</h4>
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              {projects.find((p: any) => p.id === payment.projectId)?.name || 'عام'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                              <p className="text-sm text-blue-600 dark:text-blue-400">إجمالي المستحق</p>
                              <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                                {formatCurrency(payment.totalAmount)}
                              </p>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                              <p className="text-sm text-green-600 dark:text-green-400">المدفوع</p>
                              <p className="text-lg font-bold text-green-800 dark:text-green-200">
                                {formatCurrency(payment.paidAmount)}
                              </p>
                            </div>
                            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                              <p className="text-sm text-orange-600 dark:text-orange-400">المتبقي</p>
                              <p className="text-lg font-bold text-orange-800 dark:text-orange-200">
                                {formatCurrency(payment.totalAmount - payment.paidAmount)}
                              </p>
                            </div>
                          </div>
                          
                          {payment.description && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">الوصف: </span>
                              <span className="text-sm text-gray-800 dark:text-gray-200">{payment.description}</span>
                            </div>
                          )}
                          
                          {payment.dueDate && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">تاريخ الاستحقاق: </span>
                              <span className="text-sm text-gray-800 dark:text-gray-200">
                                {new Date(payment.dueDate).toLocaleDateString('ar-EG')}
                              </span>
                            </div>
                          )}
                          
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((payment.paidAmount / payment.totalAmount) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-1">
                            تقدم السداد: {Math.round((payment.paidAmount / payment.totalAmount) * 100)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* جدول المعاملات */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      معاملات {getAccountTypeName(dialogAccountType)}
                    </h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>المشروع</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>النوع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getTransactionsByAccountType(dialogAccountType).map((transaction) => {
                        const project = projects.find(p => p.id === transaction.projectId);
                        return (
                          <TableRow key={transaction.id}>
                            <TableCell className="text-sm">
                              {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ar })}
                            </TableCell>
                            <TableCell className="text-sm max-w-xs truncate">
                              {transaction.description}
                            </TableCell>
                            <TableCell className="text-sm">
                              {project?.name || 'غير محدد'}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              <span className="text-red-600">
                                {formatCurrency(Math.abs(transaction.amount))}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">
                                مصروف
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {getTransactionsByAccountType(dialogAccountType).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد معاملات لهذا النوع من الحسابات
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}