import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Download, Search, Calendar, Filter, TrendingUp, TrendingDown, DollarSign, Building2, Activity, Calculator, FileSpreadsheet, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import type { Transaction, Project, User } from '@/types'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('د.ع.', '').trim() + ' د.ع';
};

// أنواع الحسابات المحاسبية
const ACCOUNT_TYPES: Record<string, string> = {
  salaries: 'الرواتب والأجور',
  advances: 'السلف والمقدمات',
  materials: 'المواد والمعدات',
  fuel: 'الوقود والمحروقات',
  electricity: 'فواتير الكهرباء',
  water: 'فواتير المياه',
  communications: 'الاتصالات والإنترنت',
  maintenance: 'الصيانة والإصلاحات',
  insurance: 'التأمين',
  rent: 'الإيجارات',
  transportation: 'النقل والمواصلات',
  taxes: 'الضرائب والرسوم الحكومية',
  fees: 'الرسوم والعمولات',
  training: 'التدريب والتطوير',
  stationery: 'القرطاسية والمكتبيات',
  marketing: 'التسويق والإعلان',
  consultancy: 'الاستشارات والخدمات المهنية',
  financial_services: 'الخدمات المالية والمصرفية',
  generalExpenses: 'المصروفات العامة',
  revenue: 'الإيرادات',
  other: 'متفرقات'
};

// حالة لتخزين أنواع الحسابات الديناميكية
let DYNAMIC_ACCOUNT_TYPES: Record<string, string> = {};

// تحديد نوع الحساب بناءً على الوصف أو نوع المصروف المحدد
const getAccountType = (description: string, expenseType?: string): string => {
  // إذا كان هناك نوع مصروف محدد، استخدمه مباشرة
  if (expenseType) {
    const typeKey = expenseType.toLowerCase().replace(/\s+/g, '_');
    
    // إضافة النوع الجديد إلى القائمة الديناميكية إذا لم يكن موجوداً
    if (!ACCOUNT_TYPES[typeKey] && !DYNAMIC_ACCOUNT_TYPES[typeKey]) {
      DYNAMIC_ACCOUNT_TYPES[typeKey] = expenseType;
    }
    
    return typeKey;
  }

  const desc = description?.toLowerCase() || '';
  
  if (desc.includes('راتب') || desc.includes('أجر') || desc.includes('مكافأة') || desc.includes('اجور تشغيلية')) {
    return 'salaries';
  } else if (desc.includes('سلفة') || desc.includes('سلف')) {
    return 'advances';
  } else if (desc.includes('مشتريات') || desc.includes('شراء') || desc.includes('مواد') || desc.includes('معدات') || desc.includes('أدوات')) {
    return 'materials';
  } else if (desc.includes('وقود') || desc.includes('بنزين') || desc.includes('ديزل')) {
    return 'fuel';
  } else if (desc.includes('كهرباء') || desc.includes('كهربائي')) {
    return 'electricity';
  } else if (desc.includes('ماء') || desc.includes('مياه')) {
    return 'water';
  } else if (desc.includes('اتصالات') || desc.includes('هاتف') || desc.includes('إنترنت') || desc.includes('انترنت')) {
    return 'communications';
  } else if (desc.includes('صيانة') || desc.includes('إصلاح') || desc.includes('تصليح') || desc.includes('اصلاح')) {
    return 'maintenance';
  } else if (desc.includes('تأمين') || desc.includes('تامين')) {
    return 'insurance';
  } else if (desc.includes('ايجار') || desc.includes('إيجار')) {
    return 'rent';
  } else if (desc.includes('نقل') || desc.includes('مواصلات') || desc.includes('توصيل')) {
    return 'transportation';
  } else if (desc.includes('ضرائب') || desc.includes('ضريبة')) {
    return 'taxes';
  } else if (desc.includes('رسوم') || desc.includes('رسم')) {
    return 'fees';
  } else if (desc.includes('تدريب') || desc.includes('دورة') || desc.includes('ورشة')) {
    return 'training';
  } else if (desc.includes('قرطاسية') || desc.includes('مكتبية') || desc.includes('ورق')) {
    return 'stationery';
  } else if (desc.includes('تسويق') || desc.includes('إعلان') || desc.includes('دعاية') || desc.includes('اعلان')) {
    return 'marketing';
  } else if (desc.includes('استشارات') || desc.includes('استشارة') || desc.includes('خبرة')) {
    return 'consultancy';
  } else if (desc.includes('خدمات مالية') || desc.includes('بنك') || desc.includes('فوائد')) {
    return 'financial_services';
  } else if (desc.includes('إيراد') || desc.includes('مبيعات') || desc.includes('دخل')) {
    return 'revenue';
  } else if (desc.includes('مصروف عام') || desc.includes('عام')) {
    return 'generalExpenses';
  } else {
    return 'other';
  }
};

// دالة للحصول على اسم نوع الحساب مع دعم الأنواع الديناميكية
const getAccountTypeName = (accountType: string): string => {
  return ACCOUNT_TYPES[accountType] || DYNAMIC_ACCOUNT_TYPES[accountType] || accountType;
};

export default function Reports() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ledger');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedAccountType, setSelectedAccountType] = useState<string>('all');
  const [dialogAccountType, setDialogAccountType] = useState<string | null>(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  // جلب البيانات
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions']
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects']
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users']
  });

  // فلترة المعاملات
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
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

      const accountType = getAccountType(transaction.description || '');
      const matchesAccountType = selectedAccountType === 'all' || accountType === selectedAccountType;
      
      return matchesSearch && matchesProject && matchesDate && matchesAccountType;
    });
  }, [transactions, searchQuery, selectedProject, dateFilter, selectedAccountType]);

  // فلترة المعاملات لحساب معين
  const getTransactionsByAccountType = (accountType: string) => {
    return filteredTransactions.filter(transaction => {
      const transactionAccountType = getAccountType(transaction.description || '');
      return transactionAccountType === accountType;
    });
  };

  // فتح حوار المعاملات لنوع حساب معين
  const openAccountDialog = (accountType: string) => {
    setDialogAccountType(accountType);
    setAccountDialogOpen(true);
  };

  // تجميع الحسابات حسب النوع
  const accountSummary = useMemo(() => {
    const summary: Record<string, { transactions: Transaction[], total: number, count: number }> = {};
    
    // تجميع المعاملات حسب نوع الحساب
    filteredTransactions.forEach(transaction => {
      const accountType = getAccountType(transaction.description || '', (transaction as any).expenseType);
      
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
  }, [filteredTransactions]);

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
      const accountType = getAccountType(t.description || '');
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
          <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1">
            <TabsTrigger value="ledger" className="text-xs md:text-sm px-2 py-2 whitespace-nowrap">دفتر الأستاذ</TabsTrigger>
            <TabsTrigger value="summary" className="text-xs md:text-sm px-2 py-2 whitespace-nowrap">ملخص الحسابات</TabsTrigger>
            <TabsTrigger value="details" className="text-xs md:text-sm px-2 py-2 whitespace-nowrap">التفاصيل</TabsTrigger>
          </TabsList>

          {/* أدوات الفلترة المحاسبية */}
          <div className="bg-gradient-to-r from-muted/20 to-muted/10 rounded-xl p-3 md:p-6 border shadow-sm mt-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="البحث في الوصف أو المبلغ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 text-sm bg-background/80 border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <Select value={selectedAccountType} onValueChange={setSelectedAccountType}>
                  <SelectTrigger className="w-full bg-background/80 border-border/50 text-sm">
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
                  <SelectTrigger className="w-full bg-background/80 border-border/50 text-sm">
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
                  <SelectTrigger className="w-full sm:col-span-2 lg:col-span-1 bg-background/80 border-border/50 text-sm">
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

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-border/30">
                <Button 
                  onClick={exportLedgerToExcel} 
                  className="btn-primary flex items-center gap-2 whitespace-nowrap shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  تصدير Excel
                </Button>
              </div>
            </div>
          </div>

          {/* تبويب دفتر الأستاذ - العرض المحاسبي */}
          <TabsContent value="ledger" className="space-y-6 animate-fade-in">
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
                    <Badge variant="secondary" className="w-fit text-xs">
                      {data.count} معاملة
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-lg md:text-2xl font-bold text-[hsl(var(--foreground))] mb-1">
                      {formatCurrency(data.total)}
                    </div>
                    <div className="text-xs md:text-sm text-[hsl(var(--muted-foreground))]">
                      متوسط: {formatCurrency(data.total / data.count)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* جدول تفصيلي للحسابات */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  تفاصيل دفتر الأستاذ
                </CardTitle>
                <CardDescription>
                  تجميع محاسبي شامل للمعاملات المالية حسب أنواع الحسابات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="table-container mobile-archive-table">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">نوع الحساب</TableHead>
                        <TableHead className="text-center">عدد المعاملات</TableHead>
                        <TableHead className="text-center">إجمالي المبلغ</TableHead>
                        <TableHead className="text-center">متوسط المعاملة</TableHead>
                        <TableHead className="text-center">النسبة من الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(accountSummary)
                        .sort(([,a], [,b]) => b.total - a.total)
                        .map(([accountType, data]) => {
                          const percentage = ((data.total / stats.totalExpenses) * 100).toFixed(1);
                          return (
                            <TableRow key={accountType} className="hover:bg-muted/50">
                              <TableCell className="font-medium text-center">
                                {getAccountTypeName(accountType)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">{data.count}</Badge>
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                {formatCurrency(data.total)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatCurrency(data.total / data.count)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{percentage}%</Badge>
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
                                  {getAccountTypeName(getAccountType(transaction.description || '', (transaction as any).expenseType))}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs md:text-sm py-2 md:py-3 hidden lg:table-cell">
                                {getAccountTypeName(getAccountType(transaction.description || '', (transaction as any).expenseType))}
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

                {/* جدول المعاملات */}
                <div className="border rounded-lg overflow-hidden">
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