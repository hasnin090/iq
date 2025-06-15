import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CalendarIcon, BookOpen, Search, Filter, Download, Calculator, TrendingUp, TrendingDown, Minus, DollarSign, PiggyBank, Building } from 'lucide-react';
import { formatCurrency } from '@/lib/chart-utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import * as XLSX from 'xlsx';

interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: string;
  description: string;
  projectId?: number;
  expenseType?: string;
  createdBy: number;
}

interface Project {
  id: number;
  name: string;
}

interface Fund {
  id: number;
  name: string;
  balance: number;
  type: 'admin' | 'project';
  projectId?: number;
}

export default function GeneralLedger() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // التحقق من صلاحيات المدير
  if (user?.role !== 'admin') {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">دفتر الأستاذ</h2>
            <p className="text-gray-600">هذا القسم مخصص للمدير فقط</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // استعلام البيانات
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: adminFundData } = useQuery({
    queryKey: ['/api/admin-fund'],
  });

  // إنشاء مصفوفة الصناديق من البيانات المستلمة
  const funds = useMemo(() => {
    const fundsArray: Fund[] = [];
    
    // إضافة صندوق المدير الرئيسي
    if (adminFundData?.balance !== undefined) {
      fundsArray.push({
        id: 1,
        name: 'الصندوق الرئيسي',
        balance: adminFundData.balance,
        type: 'admin',
        projectId: null
      });
    }
    
    // إضافة صناديق المشاريع (حساب رصيد كل مشروع من المعاملات)
    projects.forEach(project => {
      const projectTransactions = transactions.filter(t => t.projectId === project.id);
      const income = projectTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = projectTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const balance = income - expenses;
      
      fundsArray.push({
        id: project.id + 1000, // تأكد من عدم التداخل مع معرف الصندوق الرئيسي
        name: `صندوق ${project.name}`,
        balance: balance,
        type: 'project',
        projectId: project.id
      });
    });
    
    return fundsArray;
  }, [adminFundData, projects, transactions]);

  // فلترة المعاملات
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // فلترة حسب المشروع
    if (selectedProject !== 'all') {
      const projectId = parseInt(selectedProject);
      filtered = filtered.filter(t => t.projectId === projectId);
    }

    // فلترة حسب البحث
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.amount.toString().includes(query) ||
        t.expenseType?.toLowerCase().includes(query)
      );
    }

    // فلترة حسب التاريخ
    if (startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(t => new Date(t.date) <= endDate);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedProject, searchQuery, startDate, endDate]);

  // حساب الإحصائيات
  const statistics = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    
    const projectsData = projects.map(project => {
      const projectTransactions = filteredTransactions.filter(t => t.projectId === project.id);
      const income = projectTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = projectTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      return {
        ...project,
        income,
        expenses,
        balance: income - expenses,
        transactionCount: projectTransactions.length
      };
    });

    return {
      totalIncome,
      totalExpenses,
      balance,
      projectsData,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions, projects]);

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
        'المبلغ المنسق': formatCurrency(t.amount),
        'الرصيد التراكمي': calculateRunningBalance(t.id)
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'دفتر الأستاذ');

    const fileName = `general_ledger_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "تم التصدير بنجاح",
      description: `تم تصدير ${filteredTransactions.length} سجل إلى Excel`,
    });
  };

  // حساب الرصيد التراكمي
  const calculateRunningBalance = (transactionId: number) => {
    const sortedTransactions = filteredTransactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let runningBalance = 0;
    const index = sortedTransactions.findIndex(t => t.id === transactionId);
    
    for (let i = 0; i <= index; i++) {
      const transaction = sortedTransactions[i];
      if (transaction.type === 'income') {
        runningBalance += transaction.amount;
      } else {
        runningBalance -= transaction.amount;
      }
    }
    
    return runningBalance;
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="py-6 px-4 pb-mobile-nav-large">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[hsl(var(--primary))] flex items-center gap-3">
            <BookOpen className="text-[hsl(var(--primary))]" />
            دفتر الأستاذ العام
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">دفتر شامل لجميع المعاملات المالية والأرصدة - مخصص للمدير فقط</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="transactions">سجل المعاملات</TabsTrigger>
            <TabsTrigger value="projects">تحليل المشاريع</TabsTrigger>
            <TabsTrigger value="balances">الأرصدة</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* بطاقات الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(statistics.totalIncome)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(statistics.totalExpenses)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">صافي الربح/الخسارة</CardTitle>
                  <Calculator className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${statistics.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(statistics.balance))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statistics.balance >= 0 ? 'ربح' : 'خسارة'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">عدد المعاملات</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.transactionCount.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {/* ملخص المشاريع */}
            <Card>
              <CardHeader>
                <CardTitle>ملخص المشاريع</CardTitle>
                <CardDescription>أداء المشاريع المالي</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics.projectsData.map(project => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <Building className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">{project.transactionCount} معاملة</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-600">الإيرادات: {formatCurrency(project.income)}</p>
                        <p className="text-sm text-red-600">المصروفات: {formatCurrency(project.expenses)}</p>
                        <p className={`font-bold ${project.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          الرصيد: {formatCurrency(Math.abs(project.balance))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            {/* أدوات التحكم والفلترة */}
            <Card>
              <CardHeader>
                <CardTitle>فلترة وبحث المعاملات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>المشروع</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
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
                  </div>

                  <div>
                    <Label>من تاريخ</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'yyyy/MM/dd', { locale: ar }) : 'اختر التاريخ'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>إلى تاريخ</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'yyyy/MM/dd', { locale: ar }) : 'اختر التاريخ'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>البحث</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="ابحث في الوصف أو المبلغ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedProject('all');
                      setStartDate(undefined);
                      setEndDate(undefined);
                      setSearchQuery('');
                    }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    مسح الفلاتر
                  </Button>
                  <Button onClick={exportToExcel}>
                    <Download className="w-4 h-4 mr-2" />
                    تصدير إلى Excel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* جدول المعاملات */}
            <Card>
              <CardHeader>
                <CardTitle>سجل المعاملات المالية</CardTitle>
                <CardDescription>عرض تفصيلي لجميع المعاملات المالية ({filteredTransactions.length} معاملة)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>المشروع</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>نوع المصروف</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">الرصيد التراكمي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            لا توجد معاملات مالية وفقاً للفلاتر المحددة
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions.map((transaction) => {
                          const project = projects.find(p => p.id === transaction.projectId);
                          const runningBalance = calculateRunningBalance(transaction.id);
                          
                          return (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                {format(new Date(transaction.date), 'yyyy/MM/dd', { locale: ar })}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {transaction.description}
                              </TableCell>
                              <TableCell>
                                {project?.name || 'الصندوق الرئيسي'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                                  {transaction.type === 'income' ? 'إيراد' : 'مصروف'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {transaction.expenseType || '-'}
                              </TableCell>
                              <TableCell className={`text-right font-medium ${
                                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell className={`text-right font-bold ${
                                runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(Math.abs(runningBalance))}
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

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تحليل الأداء المالي للمشاريع</CardTitle>
                <CardDescription>مقارنة أداء المشاريع المختلفة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {statistics.projectsData.map(project => (
                    <Card key={project.id} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Building className="h-6 w-6 text-blue-600" />
                          <h3 className="text-lg font-semibold">{project.name}</h3>
                        </div>
                        <Badge variant={project.balance >= 0 ? 'default' : 'destructive'}>
                          {project.balance >= 0 ? 'ربحي' : 'خاسر'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm text-green-600 dark:text-green-400">الإيرادات</p>
                          <p className="text-xl font-bold text-green-700 dark:text-green-300">
                            {formatCurrency(project.income)}
                          </p>
                        </div>
                        
                        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-sm text-red-600 dark:text-red-400">المصروفات</p>
                          <p className="text-xl font-bold text-red-700 dark:text-red-300">
                            {formatCurrency(project.expenses)}
                          </p>
                        </div>
                        
                        <div className={`text-center p-3 rounded-lg ${
                          project.balance >= 0 
                            ? 'bg-blue-50 dark:bg-blue-900/20' 
                            : 'bg-orange-50 dark:bg-orange-900/20'
                        }`}>
                          <p className={`text-sm ${
                            project.balance >= 0 
                              ? 'text-blue-600 dark:text-blue-400' 
                              : 'text-orange-600 dark:text-orange-400'
                          }`}>
                            الرصيد
                          </p>
                          <p className={`text-xl font-bold ${
                            project.balance >= 0 
                              ? 'text-blue-700 dark:text-blue-300' 
                              : 'text-orange-700 dark:text-orange-300'
                          }`}>
                            {formatCurrency(Math.abs(project.balance))}
                          </p>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">عدد المعاملات</p>
                          <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
                            {project.transactionCount}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balances" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>أرصدة الصناديق</CardTitle>
                <CardDescription>عرض أرصدة جميع الصناديق في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {funds.map(fund => (
                    <Card key={fund.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <PiggyBank className={`h-6 w-6 ${fund.type === 'admin' ? 'text-purple-600' : 'text-blue-600'}`} />
                          <div>
                            <h3 className="font-semibold">{fund.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {fund.type === 'admin' ? 'صندوق إداري' : 'صندوق مشروع'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${fund.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(fund.balance))}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {fund.balance >= 0 ? 'رصيد موجب' : 'رصيد سالب'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}