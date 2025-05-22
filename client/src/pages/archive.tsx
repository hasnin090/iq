import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Archive, Search, Filter, Calendar, TrendingUp, TrendingDown, DollarSign, FileText } from "lucide-react";
import { formatDate } from "@/utils/date-utils";

// دالة تنسيق العملة محلياً
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// تعريف أنواع البيانات للمعاملات المالية
interface ArchivedTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  date: string;
  projectId?: number;
  userId: number;
  attachmentUrl?: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  startDate: string;
  status: string;
}

// تجميع المعاملات حسب الشهر
interface MonthlyGroup {
  month: string;
  year: number;
  transactions: ArchivedTransaction[];
  totalRevenue: number;
  totalExpense: number;
}

export default function ArchivePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all'); // all, income, expense
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // جلب المعاملات المؤرشفة
  const { data: archivedTransactions = [], isLoading: transactionsLoading } = useQuery<ArchivedTransaction[]>({
    queryKey: ['/api/archive'],
    enabled: !!user,
  });

  // جلب المشاريع
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  // فلترة المعاملات المؤرشفة
  const filteredTransactions = useMemo(() => {
    let filtered = archivedTransactions;

    // فلترة حسب البحث النصي
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(searchTerm) ||
        projects.find(p => p.id === transaction.projectId)?.name.toLowerCase().includes(searchTerm)
      );
    }

    // فلترة حسب المشروع
    if (selectedProject !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.projectId === parseInt(selectedProject)
      );
    }

    // فلترة حسب نوع المعاملة
    if (selectedType !== 'all') {
      if (selectedType === 'income') {
        filtered = filtered.filter(transaction => transaction.type === 'income');
      } else if (selectedType === 'expense') {
        filtered = filtered.filter(transaction => transaction.type === 'expense');
      }
    }

    return filtered;
  }, [archivedTransactions, searchQuery, selectedProject, selectedType, projects]);

  // تجميع المعاملات حسب الأشهر
  const monthlyGroups = useMemo(() => {
    const groups: { [key: string]: MonthlyGroup } = {};

    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

      if (!groups[monthKey]) {
        groups[monthKey] = {
          month: monthName,
          year: date.getFullYear(),
          transactions: [],
          totalRevenue: 0,
          totalExpense: 0
        };
      }

      groups[monthKey].transactions.push(transaction);
      
      if (transaction.type === 'income') {
        groups[monthKey].totalRevenue += transaction.amount;
      } else {
        groups[monthKey].totalExpense += transaction.amount;
      }
    });

    // ترتيب المجموعات حسب التاريخ (الأحدث أولاً)
    return Object.values(groups).sort((a, b) => b.year - a.year);
  }, [filteredTransactions]);

  // فلترة حسب الشهر المحدد
  const finalGroups = useMemo(() => {
    if (selectedMonth === 'all') {
      return monthlyGroups;
    }
    return monthlyGroups.filter(group => 
      `${group.year}-${new Date(group.transactions[0].date).getMonth()}` === selectedMonth
    );
  }, [monthlyGroups, selectedMonth]);

  // احصائيات عامة
  const totalStats = useMemo(() => {
    const totalRevenue = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalRevenue, totalExpense };
  }, [filteredTransactions]);

  // الحصول على اسم المشروع
  const getProjectName = (projectId?: number) => {
    if (!projectId) return 'غير محدد';
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'مشروع غير معروف';
  };

  // أيقونة نوع المعاملة
  const getTransactionIcon = (type: string) => {
    return type === 'income' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  // لون نوع المعاملة
  const getTransactionColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  if (!user) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* عنوان الصفحة */}
        <div className="bg-gradient-to-l from-primary/5 to-transparent p-4 sm:p-6 mb-6 sm:mb-8 rounded-xl border border-primary/10 shadow-sm">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-md">
                <Archive className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h2 className="heading-responsive font-bold text-primary">أرشيف المعاملات المالية</h2>
            </div>
            <p className="text-responsive text-muted-foreground pr-1">
              عرض المعاملات المالية التي مضى عليها أكثر من 30 يوماً، مرتبة حسب الأشهر
            </p>
          </div>
        </div>

        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الإيرادات المؤرشفة</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(totalStats.totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المصاريف المؤرشفة</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(totalStats.totalExpense)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Archive className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عدد المعاملات المؤرشفة</p>
                  <p className="text-lg font-bold text-blue-600">{filteredTransactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* أدوات البحث والفلترة */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* البحث النصي */}
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الوصف أو المشروع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                />
              </div>

              {/* فلتر نوع المعاملة */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="نوع المعاملة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المعاملات</SelectItem>
                  <SelectItem value="income">الإيرادات فقط</SelectItem>
                  <SelectItem value="expense">المصاريف فقط</SelectItem>
                </SelectContent>
              </Select>

              {/* فلتر المشروع */}
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="المشروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المشاريع</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* فلتر الشهر */}
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="الشهر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأشهر</SelectItem>
                  {monthlyGroups.map((group) => {
                    const monthKey = `${group.year}-${new Date(group.transactions[0].date).getMonth()}`;
                    return (
                      <SelectItem key={monthKey} value={monthKey}>
                        {group.month}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* المحتوى الرئيسي */}
        {transactionsLoading ? (
          <div className="text-center py-10">
            <div className="spinner w-10 h-10 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">جاري تحميل المعاملات المؤرشفة...</p>
          </div>
        ) : finalGroups.length === 0 ? (
          <Card>
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="text-5xl mb-4 opacity-20">📁</div>
              <p className="text-muted-foreground text-lg mb-2">لا توجد معاملات مؤرشفة</p>
              <p className="text-sm text-muted-foreground">
                المعاملات المالية تظهر هنا بعد مضي 30 يوماً على إدخالها
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {finalGroups.map((group, groupIndex) => (
              <Card key={groupIndex} className="shadow-md">
                <CardHeader className="bg-gradient-to-l from-primary/10 to-primary/5 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{group.month}</CardTitle>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        إيرادات: {formatCurrency(group.totalRevenue)}
                      </Badge>
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        مصاريف: {formatCurrency(group.totalExpense)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="divide-y">
                    {group.transactions.map((transaction) => (
                      <div key={transaction.id} className="p-4 sm:p-6 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-shrink-0">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground truncate">
                                {transaction.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span>{formatDate(transaction.date)}</span>
                                <span>•</span>
                                <span>{getProjectName(transaction.projectId)}</span>
                                {transaction.attachmentUrl && (
                                  <>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                      <FileText className="h-3 w-3" />
                                      <span>يحتوي على مرفق</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-left">
                            <p className={`text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                              {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.type === 'income' ? 'إيراد' : 'مصروف'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}