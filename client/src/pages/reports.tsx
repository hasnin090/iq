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
  const [projectId, setProjectId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const financialChartRef = useRef<HTMLCanvasElement>(null);
  const projectsChartRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/projects'],
  });
  
  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
  });
  
  // Prepare data for financial report
  const getFinancialData = () => {
    if (!transactions || !Array.isArray(transactions)) {
      console.log("No transactions data or not an array");
      return { income: 0, expense: 0, profit: 0, transactions: [] };
    }
    
    console.log("Total transactions before filtering:", transactions.length);
    console.log("Selected project:", projectId);
    console.log("Selected month:", selectedMonth);
    
    let filteredTransactions = [...transactions];
    
    // Filter by project if selected
    if (projectId && projectId !== 'all') {
      const projectIdNum = parseInt(projectId);
      filteredTransactions = filteredTransactions.filter(t => {
        const match = t.projectId === projectIdNum;
        return match;
      });
      console.log(`After project filtering (projectId=${projectId}):`, filteredTransactions.length);
    }
    
    // Filter by month if selected
    if (selectedMonth) {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth();
      
      console.log(`Filtering by date: Year=${year}, Month=${month}`);
      
      filteredTransactions = filteredTransactions.filter(t => {
        // تأكد من أن حقل التاريخ صالح
        if (!t.date) {
          console.log("Transaction missing date field:", t);
          return false;
        }
        
        // تحويل التاريخ إلى كائن Date بشكل صحيح
        const date = new Date(t.date);
        
        // التأكد من صحة الكائن وإمكانية قراءة الشهر والسنة منه
        if (isNaN(date.getTime())) {
          console.log("Invalid date:", t.date);
          return false;
        }
        
        const tYear = date.getFullYear();
        const tMonth = date.getMonth();
        
        const match = tYear === year && tMonth === month;
        return match;
      });
      
      console.log("After date filtering:", filteredTransactions.length);
    }
    
    // تعزيز مرشحات النوع بإضافة تسجيل وفحص إضافي
    const incomeTransactions = filteredTransactions.filter(t => {
      const isIncome = t.type === 'income';
      return isIncome;
    });
    
    const expenseTransactions = filteredTransactions.filter(t => {
      const isExpense = t.type === 'expense';
      return isExpense;
    });
    
    console.log("Income transactions count:", incomeTransactions.length);
    console.log("Expense transactions count:", expenseTransactions.length);
    
    // تحسين حساب المبالغ مع إضافة فحص إضافي
    const income = incomeTransactions.reduce((sum, t) => {
      // التأكد من أن t.amount هو رقم
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
      return sum + amount;
    }, 0);
    
    const expense = expenseTransactions.reduce((sum, t) => {
      // التأكد من أن t.amount هو رقم
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
      return sum + amount;
    }, 0);
    
    console.log("Total income:", income);
    console.log("Total expense:", expense);
    console.log("Profit:", income - expense);
    
    return {
      income,
      expense,
      profit: income - expense,
      transactions: filteredTransactions
    };
  };
  
  // Get project name by id
  const getProjectName = (projectId?: number) => {
    if (!projectId) return 'عام';
    const project = projects && Array.isArray(projects) ? projects.find(p => p.id === projectId) : null;
    return project ? project.name : 'غير معروف';
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yyyy/MM/dd', { locale: ar });
  };
  
  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const timeStr = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${dateStr} ${timeStr}`;
  };
  
  // Initialize charts
  useEffect(() => {
    let financialChart: Chart | undefined;
    let projectsChart: Chart | undefined;
    
    const { income, expense, profit } = getFinancialData();
    
    // Financial chart
    if (financialChartRef.current && activeTab === 'financial') {
      const ctx = financialChartRef.current.getContext('2d');
      if (ctx) {
        // Destroy previous chart if it exists
        if (financialChart instanceof Chart) {
          financialChart.destroy();
        }
        
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
    if (projectsChartRef.current && activeTab === 'projects' && Array.isArray(projects) && Array.isArray(transactions)) {
      const ctx = projectsChartRef.current.getContext('2d');
      if (ctx) {
        // Destroy previous chart if it exists
        if (projectsChart instanceof Chart) {
          projectsChart.destroy();
        }
        
        console.log("Generating project chart with", projects.length, "projects");
        
        // Calculate total amount per project
        const projectData = projects.map((project: any) => {
          // تحسين تصفية المعاملات الخاصة بالمشروع
          const projectTransactions = transactions.filter((t: any) => {
            // التأكد من أن المعاملة تحتوي على معرف المشروع وأنه يطابق المشروع الحالي
            return t && t.projectId === project.id;
          });
          
          console.log(`Project ${project.name} (ID: ${project.id}) has ${projectTransactions.length} transactions`);
          
          // تصفية وحساب الإيرادات
          const incomeTransactions = projectTransactions.filter((t: any) => t.type === 'income');
          const income = incomeTransactions.reduce((sum: number, t: any) => {
            // التأكد من أن t.amount هو رقم
            const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
            return sum + amount;
          }, 0);
          
          // تصفية وحساب المصروفات
          const expenseTransactions = projectTransactions.filter((t: any) => t.type === 'expense');
          const expense = expenseTransactions.reduce((sum: number, t: any) => {
            // التأكد من أن t.amount هو رقم
            const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
            return sum + amount;
          }, 0);
            
          console.log(`Project ${project.name}: Income=${income}, Expense=${expense}, Profit=${income - expense}`);
          
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
      if (financialChart instanceof Chart) financialChart.destroy();
      if (projectsChart instanceof Chart) projectsChart.destroy();
    };
  }, [activeTab, projectId, selectedMonth, transactions, projects]);
  
  // Export report to PDF
  const exportToPdf = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    // إنشاء عنصر مخصص للتصدير بتنسيق مناسب للطباعة
    const exportContainer = document.createElement('div');
    exportContainer.style.direction = 'rtl';
    exportContainer.style.fontFamily = 'Arial, sans-serif';
    exportContainer.style.textAlign = 'right';
    exportContainer.style.padding = '20px';
    
    // إضافة العنوان والتاريخ في أعلى المستند
    const header = document.createElement('div');
    header.style.marginBottom = '20px';
    header.style.textAlign = 'center';
    
    const title = document.createElement('h1');
    title.textContent = activeTab === 'transactions' ? 'تقرير المعاملات المالية' :
                        activeTab === 'projects' ? 'تقرير المشاريع' :
                        activeTab === 'users' ? 'تقرير المستخدمين' : 'تقرير مالي';
    title.style.margin = '0 0 10px 0';
    title.style.color = '#2563eb';
    title.style.fontSize = '24px';
    header.appendChild(title);
    
    const subtitle = document.createElement('p');
    const currentDate = format(new Date(), 'yyyy/MM/dd', { locale: ar });
    subtitle.textContent = `تم توليد التقرير بتاريخ: ${currentDate}`;
    subtitle.style.margin = '0';
    subtitle.style.fontSize = '14px';
    subtitle.style.color = '#4b5563';
    header.appendChild(subtitle);
    
    if (selectedMonth) {
      const filterInfo = document.createElement('p');
      filterInfo.textContent = `تصفية حسب الشهر: ${format(selectedMonth, 'MMMM yyyy', { locale: ar })}`;
      filterInfo.style.margin = '5px 0 0 0';
      filterInfo.style.fontSize = '14px';
      filterInfo.style.color = '#4b5563';
      header.appendChild(filterInfo);
    }
    
    if (projectId !== 'all') {
      const projectName = projects.find((p: any) => p.id.toString() === projectId)?.name || '';
      if (projectName) {
        const projectInfo = document.createElement('p');
        projectInfo.textContent = `المشروع: ${projectName}`;
        projectInfo.style.margin = '5px 0 0 0';
        projectInfo.style.fontSize = '14px';
        projectInfo.style.color = '#4b5563';
        header.appendChild(projectInfo);
      }
    }
    
    exportContainer.appendChild(header);
    
    // إضافة ملخص البيانات المالية
    if (activeTab === 'financial' || activeTab === 'transactions') {
      const financialSummary = document.createElement('div');
      financialSummary.style.display = 'flex';
      financialSummary.style.justifyContent = 'space-between';
      financialSummary.style.gap = '16px';
      financialSummary.style.marginBottom = '24px';
      
      const createSummaryCard = (title: string, value: string, color: string, iconClass: string) => {
        const card = document.createElement('div');
        card.style.flex = '1';
        card.style.backgroundColor = '#ffffff';
        card.style.border = '1px solid #e5e7eb';
        card.style.borderRadius = '8px';
        card.style.padding = '16px';
        card.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        
        const cardTitle = document.createElement('p');
        cardTitle.textContent = title;
        cardTitle.style.fontSize = '16px';
        cardTitle.style.color = '#4b5563';
        cardTitle.style.marginBottom = '8px';
        
        const cardValue = document.createElement('p');
        cardValue.textContent = value;
        cardValue.style.fontSize = '24px';
        cardValue.style.fontWeight = 'bold';
        cardValue.style.color = color;
        
        const cardIcon = document.createElement('i');
        cardIcon.className = iconClass;
        cardIcon.style.marginLeft = '8px';
        cardIcon.style.fontSize = '16px';
        cardValue.prepend(cardIcon);
        
        card.appendChild(cardTitle);
        card.appendChild(cardValue);
        
        return card;
      };
      
      financialSummary.appendChild(createSummaryCard('الإيرادات', formatCurrency(income), '#047857', 'fas fa-arrow-up'));
      financialSummary.appendChild(createSummaryCard('المصروفات', formatCurrency(expense), '#b91c1c', 'fas fa-arrow-down'));
      financialSummary.appendChild(createSummaryCard('الرصيد', formatCurrency(profit), profit >= 0 ? '#1e40af' : '#b91c1c', profit >= 0 ? 'fas fa-plus-circle' : 'fas fa-minus-circle'));
      
      exportContainer.appendChild(financialSummary);
    }
    
    // بناء جدول المعاملات المالية في تبويب المعاملات
    if (activeTab === 'transactions') {
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginBottom = '20px';
      table.style.fontSize = '14px';
      
      // إنشاء صف العناوين
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      // تحديد أسماء الأعمدة ومحاذاتها
      const columns = [
        { title: 'التاريخ', align: 'right', width: '15%' },
        { title: 'الوصف', align: 'right', width: '40%' },
        { title: 'المشروع', align: 'right', width: '15%' },
        { title: 'النوع', align: 'center', width: '10%' },
        { title: 'المبلغ', align: 'left', width: '20%' }
      ];
      
      columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.title;
        th.style.padding = '12px 8px';
        th.style.backgroundColor = '#f3f4f6';
        th.style.color = '#111827';
        th.style.fontWeight = 'bold';
        th.style.textAlign = column.align;
        th.style.borderBottom = '2px solid #e5e7eb';
        th.style.width = column.width;
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // إنشاء صفوف البيانات
      const tbody = document.createElement('tbody');
      
      filteredTransactions.forEach((transaction: any, index: number) => {
        const tr = document.createElement('tr');
        
        // تنسيق الصفوف بألوان متناوبة
        if (index % 2 === 0) {
          tr.style.backgroundColor = '#f9fafb';
        } else {
          tr.style.backgroundColor = '#ffffff';
        }
        
        // إضافة خلايا البيانات
        const addCell = (content: string, align: string) => {
          const td = document.createElement('td');
          td.textContent = content;
          td.style.padding = '10px 8px';
          td.style.textAlign = align;
          td.style.borderBottom = '1px solid #e5e7eb';
          tr.appendChild(td);
        };
        
        // التاريخ
        const date = new Date(transaction.date);
        addCell(format(date, 'yyyy/MM/dd', { locale: ar }), 'right');
        
        // الوصف
        addCell(transaction.description || '', 'right');
        
        // المشروع
        const projectName = projects.find((p: any) => p.id === transaction.projectId)?.name || 'عام';
        addCell(projectName, 'right');
        
        // النوع (مع رمز)
        const typeCell = document.createElement('td');
        typeCell.style.padding = '10px 8px';
        typeCell.style.textAlign = 'center';
        typeCell.style.borderBottom = '1px solid #e5e7eb';
        
        const typeContent = document.createElement('span');
        typeContent.style.display = 'inline-block';
        typeContent.style.padding = '4px 8px';
        typeContent.style.borderRadius = '4px';
        typeContent.style.fontWeight = 'bold';
        
        if (transaction.type === 'income') {
          typeContent.textContent = 'إيراد';
          typeContent.style.backgroundColor = '#d1fae5';
          typeContent.style.color = '#065f46';
        } else {
          typeContent.textContent = 'مصروف';
          typeContent.style.backgroundColor = '#fee2e2';
          typeContent.style.color = '#b91c1c';
        }
        
        typeCell.appendChild(typeContent);
        tr.appendChild(typeCell);
        
        // المبلغ (بتنسيق العملة)
        const amountCell = document.createElement('td');
        amountCell.textContent = formatCurrency(transaction.amount);
        amountCell.style.padding = '10px 8px';
        amountCell.style.textAlign = 'left';
        amountCell.style.borderBottom = '1px solid #e5e7eb';
        amountCell.style.fontWeight = 'bold';
        amountCell.style.fontFamily = 'Tahoma, Arial, sans-serif'; // خط يدعم الأرقام بشكل أفضل
        tr.appendChild(amountCell);
        
        tbody.appendChild(tr);
      });
      
      table.appendChild(tbody);
      exportContainer.appendChild(table);
    }
    
    // إضافة رسوم بيانية إذا كانت موجودة
    if (activeTab === 'financial') {
      const chartsContainer = document.createElement('div');
      chartsContainer.style.marginTop = '20px';
      chartsContainer.style.display = 'flex';
      chartsContainer.style.justifyContent = 'center';
      chartsContainer.style.alignItems = 'center';
      
      // بدلاً من محاولة نسخ الرسم البياني، يمكننا إضافة ملاحظة
      const chartNote = document.createElement('p');
      chartNote.textContent = 'ملاحظة: يمكنك مشاهدة الرسوم البيانية التفاعلية في النظام.';
      chartNote.style.textAlign = 'center';
      chartNote.style.padding = '20px';
      chartNote.style.backgroundColor = '#f9fafb';
      chartNote.style.borderRadius = '8px';
      chartNote.style.color = '#4b5563';
      
      chartsContainer.appendChild(chartNote);
      exportContainer.appendChild(chartsContainer);
    }
    
    // إضافة رقم الصفحة في التذييل
    const footer = document.createElement('div');
    footer.style.marginTop = '30px';
    footer.style.textAlign = 'center';
    footer.style.fontSize = '12px';
    footer.style.color = '#6b7280';
    footer.textContent = 'صفحة 1 من 1 - نظام المحاسبة المالية';
    exportContainer.appendChild(footer);
    
    // إعدادات التصدير
    const opt = {
      margin: [15, 10, 15, 10], // [top, right, bottom, left] بالملم
      filename: `تقرير-${activeTab === 'transactions' ? 'المعاملات' : 
                      activeTab === 'projects' ? 'المشاريع' : 
                      activeTab === 'users' ? 'المستخدمين' : 'مالي'}-${currentDate}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        allowTaint: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: activeTab === 'transactions' ? 'landscape' : 'portrait',
        compress: true,
        putOnlyUsedFonts: true,
        floatPrecision: 16
      }
    };
    
    // استخدام النسخة المخصصة المنشأة للتصدير
    html2pdf().from(exportContainer).set(opt).save();
    
    toast({
      title: "تم التصدير بنجاح",
      description: "تم تصدير التقرير إلى ملف PDF بنجاح",
    });
  };
  
  const { income, expense, profit, transactions: filteredTransactions } = getFinancialData();
  
  return (
    <div className="space-y-8 py-6 pb-mobile-nav-large">
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
                <SelectItem value="all">كل المشاريع</SelectItem>
                {Array.isArray(projects) ? projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                )) : null}
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
                  onSelect={(date) => date && setSelectedMonth(date)}
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
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">التاريخ والوقت</th>
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
                                {formatDateTime(transaction.date)}
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
