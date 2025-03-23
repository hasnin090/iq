import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/chart-utils';
import Chart from 'chart.js/auto';
import html2pdf from 'html2pdf.js';
import { useToast } from '@/hooks/use-toast';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('financial');
  const [projectId, setProjectId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const financialChartRef = useRef<HTMLCanvasElement>(null);
  const projectsChartRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  const { data: transactions } = useQuery({
    queryKey: ['/api/transactions'],
  });
  
  // Prepare data for financial report
  const getFinancialData = () => {
    if (!transactions) return { income: 0, expense: 0, profit: 0, transactions: [] };
    
    let filteredTransactions = [...transactions];
    
    // Filter by project if selected
    if (projectId) {
      filteredTransactions = filteredTransactions.filter(t => t.projectId === parseInt(projectId));
    }
    
    // Filter by month if selected
    if (selectedMonth) {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth();
      filteredTransactions = filteredTransactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === month;
      });
    }
    
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expense,
      profit: income - expense,
      transactions: filteredTransactions
    };
  };
  
  // Get project name by id
  const getProjectName = (projectId?: number) => {
    if (!projectId || !projects) return 'عام';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'غير معروف';
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yyyy/MM/dd', { locale: ar });
  };
  
  // Initialize charts
  useEffect(() => {
    let financialChart: Chart | null = null;
    let projectsChart: Chart | null = null;
    
    const { income, expense, profit } = getFinancialData();
    
    // Financial chart
    if (financialChartRef.current && activeTab === 'financial') {
      const ctx = financialChartRef.current.getContext('2d');
      if (ctx) {
        if (financialChart) financialChart.destroy();
        
        financialChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['الإيرادات', 'المصروفات', 'صافي الربح'],
            datasets: [{
              label: 'البيانات المالية (د.ع)',
              data: [income, expense, profit],
              backgroundColor: [
                'rgba(52, 152, 219, 0.8)',
                'rgba(231, 76, 60, 0.8)',
                'rgba(46, 204, 113, 0.8)'
              ],
              borderColor: [
                'rgba(52, 152, 219, 1)',
                'rgba(231, 76, 60, 1)',
                'rgba(46, 204, 113, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    }
    
    // Projects chart
    if (projectsChartRef.current && activeTab === 'projects' && projects && transactions) {
      const ctx = projectsChartRef.current.getContext('2d');
      if (ctx) {
        if (projectsChart) projectsChart.destroy();
        
        // Calculate total amount per project
        const projectData = projects.map(project => {
          const projectTransactions = transactions.filter(t => t.projectId === project.id);
          const income = projectTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
          
          const expense = projectTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
          return {
            name: project.name,
            income,
            expense,
            profit: income - expense
          };
        });
        
        projectsChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: projectData.map(p => p.name),
            datasets: [
              {
                label: 'الإيرادات',
                data: projectData.map(p => p.income),
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
              },
              {
                label: 'المصروفات',
                data: projectData.map(p => p.expense),
                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 1
              },
              {
                label: 'صافي الربح',
                data: projectData.map(p => p.profit),
                backgroundColor: 'rgba(46, 204, 113, 0.8)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    }
    
    return () => {
      if (financialChart) financialChart.destroy();
      if (projectsChart) projectsChart.destroy();
    };
  }, [activeTab, projectId, selectedMonth, transactions, projects]);
  
  // Export report to PDF
  const exportToPdf = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    const opt = {
      margin: 10,
      filename: `${activeTab}-report.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(element).set(opt).save();
    
    toast({
      title: "تم التصدير بنجاح",
      description: "تم تصدير التقرير إلى ملف PDF بنجاح",
    });
  };
  
  const { income, expense, profit, transactions: filteredTransactions } = getFinancialData();
  
  return (
    <div className="space-y-8 py-6">
      <h2 className="text-2xl font-bold text-primary-light pb-2 border-b border-neutral-dark border-opacity-20">التقارير</h2>
      
      <div className="bg-secondary-light rounded-xl shadow-card p-6">
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div className="w-full md:w-64">
            <Label htmlFor="filterProject" className="block text-sm font-medium text-neutral mb-1">المشروع</Label>
            <Select 
              onValueChange={(value) => setProjectId(value)}
              value={projectId}
            >
              <SelectTrigger id="filterProject" className="w-full px-4 py-2 h-auto rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light">
                <SelectValue placeholder="كل المشاريع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">كل المشاريع</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-64">
            <Label className="block text-sm font-medium text-neutral mb-1">الشهر</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full px-4 py-2 h-auto rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light text-right justify-between items-center"
                >
                  {selectedMonth ? (
                    format(selectedMonth, "MMMM yyyy", { locale: ar })
                  ) : (
                    <span>اختر الشهر</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={setSelectedMonth}
                  initialFocus
                  locale={ar}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Button 
            variant="outline" 
            onClick={exportToPdf}
            className="px-3 py-2 bg-secondary rounded-lg text-neutral-light border border-secondary-light hover:border-primary-light transition-all"
          >
            <i className="fas fa-download mr-2"></i> تصدير PDF
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="financial" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="financial">التقرير المالي</TabsTrigger>
            <TabsTrigger value="projects">تقرير المشاريع</TabsTrigger>
            <TabsTrigger value="transactions">تفاصيل المعاملات</TabsTrigger>
          </TabsList>
          
          <div id="report-content">
            <TabsContent value="financial" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>التقرير المالي</CardTitle>
                  <CardDescription>
                    ملخص للبيانات المالية {projectId ? `للمشروع: ${getProjectName(parseInt(projectId))}` : 'لجميع المشاريع'} خلال شهر {format(selectedMonth, "MMMM yyyy", { locale: ar })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-secondary rounded-xl p-6">
                      <h3 className="text-muted-foreground text-sm mb-1">إجمالي الإيرادات</h3>
                      <p className="text-2xl font-bold text-primary-light">{formatCurrency(income)}</p>
                    </div>
                    <div className="bg-secondary rounded-xl p-6">
                      <h3 className="text-muted-foreground text-sm mb-1">إجمالي المصروفات</h3>
                      <p className="text-2xl font-bold text-destructive">{formatCurrency(expense)}</p>
                    </div>
                    <div className="bg-secondary rounded-xl p-6">
                      <h3 className="text-muted-foreground text-sm mb-1">صافي الربح</h3>
                      <p className="text-2xl font-bold text-success">{formatCurrency(profit)}</p>
                    </div>
                  </div>
                  
                  <div className="h-80 mt-6">
                    <canvas ref={financialChartRef}></canvas>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="projects" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>تقرير المشاريع</CardTitle>
                  <CardDescription>
                    مقارنة البيانات المالية بين المشاريع خلال شهر {format(selectedMonth, "MMMM yyyy", { locale: ar })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 mt-6">
                    <canvas ref={projectsChartRef}></canvas>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="transactions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل المعاملات</CardTitle>
                  <CardDescription>
                    سجل المعاملات المالية {projectId ? `للمشروع: ${getProjectName(parseInt(projectId))}` : 'لجميع المشاريع'} خلال شهر {format(selectedMonth, "MMMM yyyy", { locale: ar })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto mt-4">
                    <table className="min-w-full divide-y divide-secondary">
                      <thead>
                        <tr>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">التاريخ</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الوصف</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">المشروع</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">النوع</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">المبلغ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-light">
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((transaction) => (
                            <tr key={transaction.id}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-light">
                                {formatDate(transaction.date)}
                              </td>
                              <td className="px-4 py-3 text-sm text-neutral-light">
                                {transaction.description}
                              </td>
                              <td className="px-4 py-3 text-sm text-neutral-light">
                                {getProjectName(transaction.projectId)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  transaction.type === 'income' 
                                    ? 'bg-success bg-opacity-20 text-success' 
                                    : 'bg-destructive bg-opacity-20 text-destructive'
                                }`}>
                                  {transaction.type === 'income' ? 'ايراد' : 'مصروف'}
                                </span>
                              </td>
                              <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                                transaction.type === 'income' ? 'text-success' : 'text-destructive'
                              } font-bold`}>
                                {transaction.type === 'income' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                              لا توجد معاملات للفترة المحددة
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
