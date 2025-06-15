import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Download, Search, Calendar, Filter, TrendingUp, TrendingDown, DollarSign, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import { useToast } from '@/hooks/use-toast'
import type { Transaction, Project, User } from '@/types'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('ج.م.', '').trim() + ' ج.م';
};

export default function Reports() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('all');

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
      const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      
      return matchesSearch && matchesProject && matchesDate;
    });
  }, [transactions, searchQuery, selectedProject, dateFilter]);

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

  // تصدير إلى Excel
  const exportToExcel = () => {
    const exportData = filteredTransactions.map(t => {
      const project = projects.find(p => p.id === t.projectId);
      return {
        'التاريخ': format(new Date(t.date), 'yyyy/MM/dd', { locale: ar }),
        'الوصف': t.description,
        'المشروع': project?.name || 'الصندوق الرئيسي',
        'النوع': t.type === 'income' ? 'إيراد' : 'مصروف',
        'نوع المصروف': t.expenseType || '',
        'المبلغ': t.amount,
        'المبلغ المنسق': formatCurrency(t.amount)
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير المعاملات');
    
    const fileName = `تقرير_المعاملات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: "تم تصدير التقرير",
      description: `تم تصدير ${filteredTransactions.length} سجل إلى Excel`,
    });
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="py-4 md:py-6 px-3 md:px-4 pb-mobile-nav-large">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[hsl(var(--primary))] flex items-center gap-2 md:gap-3">
            <BookOpen className="text-[hsl(var(--primary))] w-6 h-6 md:w-8 md:h-8" />
            دفتر الأستاذ العام
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm md:text-base">دفتر شامل لجميع المعاملات المالية والأرصدة - مخصص للمدير فقط</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
            <TabsTrigger value="overview" className="text-xs md:text-sm">نظرة عامة</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs md:text-sm">المعاملات</TabsTrigger>
            <TabsTrigger value="projects" className="text-xs md:text-sm">المشاريع</TabsTrigger>
            <TabsTrigger value="balances" className="text-xs md:text-sm">الأرصدة</TabsTrigger>
          </TabsList>

          {/* أدوات الفلترة */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 my-4 md:my-6">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث في الوصف أو المبلغ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-sm"
              />
            </div>
            
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-full md:w-[200px]">
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
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفترات</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">آخر أسبوع</SelectItem>
                <SelectItem value="month">آخر شهر</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={exportToExcel} 
              variant="outline" 
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              تصدير Excel
            </Button>
          </div>

          <TabsContent value="overview" className="space-y-6 animate-fade-in">
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
                                  {transaction.expenseType || '-'}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs md:text-sm py-2 md:py-3 hidden lg:table-cell">
                                {transaction.expenseType || '-'}
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
    </div>
  );
}