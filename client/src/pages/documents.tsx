import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { DocumentForm } from '@/components/document-form';
import { DocumentList } from '@/components/document-list';
import { queryClient } from '@/lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from "@/components/ui/badge";
import { Lock, ShieldAlert, FileText, AlertCircle, CalendarIcon, File, FileImage, Clock, Filter, Search, Download, Eye, Calendar as CalendarIcon2 } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDays, format, getYear } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Calendar
} from "@/components/ui/calendar";
import { getFileType } from "@/lib/firebase-storage";
import { getFileTypeLabel, getFileTypeIcon, getFileTypeBadgeClasses } from "@/lib/file-helpers";
import { ImageViewer } from '@/components/image-viewer';
import { ImageLightbox } from '@/components/image-lightbox';

interface Filter {
  projectId?: number;
  isManagerDocument?: boolean;
  fileType?: string;
  searchQuery?: string;
  dateRange?: {
    from: Date | null | undefined;
    to: Date | null | undefined;
  };
}

export default function Documents() {
  const [filter, setFilter] = useState<Filter>({});
  const [activeTab, setActiveTab] = useState("all"); // "all" or "manager"
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  // العادية المستندات
  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents', { ...filter, isManagerDocument: false }],
    queryFn: async ({ queryKey }) => {
      const [_, filterParams] = queryKey as [string, { projectId?: number, isManagerDocument?: boolean }];
      const params = new URLSearchParams();
      
      if (filterParams.projectId) params.append('projectId', String(filterParams.projectId));
      if (filterParams.isManagerDocument !== undefined) params.append('isManagerDocument', String(filterParams.isManagerDocument));
      
      const response = await fetch(`/api/documents?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });
  
  // المستندات الإدارية (خاصة بالمدراء)
  const { data: managerDocuments, isLoading: managerDocumentsLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents', { ...filter, isManagerDocument: true }],
    queryFn: async ({ queryKey }) => {
      const [_, filterParams] = queryKey as [string, { projectId?: number, isManagerDocument?: boolean }];
      const params = new URLSearchParams();
      
      if (filterParams.projectId) params.append('projectId', String(filterParams.projectId));
      params.append('isManagerDocument', 'true');
      
      const response = await fetch(`/api/documents?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch manager documents');
      return response.json();
    },
    enabled: isManagerOrAdmin // تفعيل هذا الاستعلام فقط للمديرين
  });
  
  interface Project {
    id: number;
    name: string;
  }
  
  interface Document {
    id: number;
    name: string;
    description?: string;
    fileUrl: string;
    fileType: string;
    uploadDate: string;
    projectId?: number;
    uploadedBy: number;
    isManagerDocument?: boolean;
  }

  interface Transaction {
    id: number;
    date: string;
    amount: number;
    type: string;
    description: string;
    projectId?: number;
    createdBy: number;
    fileUrl?: string;
    fileType?: string;
  }
  
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // الحصول على المعاملات التي تحتوي على مرفقات
  const { data: transactionsWithAttachments, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions/attachments'],
    queryFn: async () => {
      const response = await fetch('/api/transactions?withAttachments=true');
      if (!response.ok) throw new Error('Failed to fetch transactions with attachments');
      const transactions = await response.json();
      // فلترة المعاملات التي تحتوي فقط على مرفقات
      return transactions.filter((transaction: Transaction) => transaction.fileUrl);
    },
    enabled: activeTab === "attachments"
  });
  
  const handleFilterChange = (newFilter: Partial<Filter>) => {
    setFilter({ ...filter, ...newFilter });
  };
  
  const handleDocumentUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // تحديد المستندات المناسبة حسب علامة التبويب النشطة وتطبيق الفلاتر
  const getActiveDocuments = () => {
    let activeDocuments = activeTab === "manager" ? (managerDocuments || []) : (documents || []);
    
    // فلترة حسب نوع الملف
    if (filter.fileType) {
      activeDocuments = activeDocuments.filter(doc => {
        const type = getFileType(doc.fileType);
        return type === filter.fileType;
      });
    }
    
    // فلترة حسب التاريخ
    if (filter.dateRange?.from || filter.dateRange?.to) {
      activeDocuments = activeDocuments.filter(doc => {
        const uploadDate = new Date(doc.uploadDate);
        
        // التحقق من تاريخ البداية
        if (filter.dateRange?.from) {
          const fromDate = new Date(filter.dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          if (uploadDate < fromDate) {
            return false;
          }
        }
        
        // التحقق من تاريخ النهاية
        if (filter.dateRange?.to) {
          const toDate = new Date(filter.dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (uploadDate > toDate) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    // فلترة حسب البحث النصي
    if (filter.searchQuery) {
      const searchTerm = filter.searchQuery.toLowerCase().trim();
      activeDocuments = activeDocuments.filter(doc => {
        return (
          doc.name.toLowerCase().includes(searchTerm) || 
          (doc.description && doc.description.toLowerCase().includes(searchTerm)) ||
          projects?.find(p => p.id === doc.projectId)?.name.toLowerCase().includes(searchTerm)
        );
      });
    }
    
    return activeDocuments;
  };

  // تحديد حالة التحميل المناسبة حسب علامة التبويب النشطة
  const isActiveTabLoading = () => {
    if (activeTab === "manager") {
      return managerDocumentsLoading;
    }
    return documentsLoading;
  };
  
  return (
    <div className="py-3 px-2 sm:py-4 md:py-6 sm:px-4">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[hsl(var(--primary))]">إدارة المستندات</h2>
        <p className="text-xs sm:text-sm md:text-base text-[hsl(var(--muted-foreground))] mt-1 sm:mt-2">إدارة وتنظيم مستندات المشاريع والملفات المهمة</p>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full mb-6 sm:mb-8">
        <TabsList className="w-full max-w-md mb-3 sm:mb-4 mx-auto overflow-x-auto no-scrollbar">
          <TabsTrigger value="all" className="flex-1 text-xs sm:text-sm">
            <FileText className="ml-0.5 sm:ml-1 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">المستندات العامة</span>
          </TabsTrigger>
          {isManagerOrAdmin && (
            <TabsTrigger value="manager" className="flex-1 text-xs sm:text-sm">
              <Lock className="ml-0.5 sm:ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">مستندات المدراء</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="attachments" className="flex-1 text-xs sm:text-sm">
            <FileImage className="ml-0.5 sm:ml-1 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">مرفقات المعاملات</span>
          </TabsTrigger>
        </TabsList>
        
        {activeTab === "manager" && !isManagerOrAdmin && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>لا يمكن الوصول</AlertTitle>
            <AlertDescription>
              لا تملك الصلاحيات اللازمة للوصول إلى مستندات المدراء.
            </AlertDescription>
          </Alert>
        )}
        
        <TabsContent value="all" className="p-0">
          {/* العامة المستندات محتوى */}
        </TabsContent>
        
        <TabsContent value="manager" className="p-0">
          {/* المدراء مستندات محتوى */}
          {!isManagerOrAdmin && (
            <Card className="border-destructive shadow-md">
              <CardHeader className="bg-destructive/10">
                <CardTitle className="flex items-center text-destructive">
                  <ShieldAlert className="ml-2 h-5 w-5" />
                  منطقة مقيدة
                </CardTitle>
                <CardDescription>
                  هذا القسم مخصص للمدراء والمشرفين فقط
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground mb-3">
                  لا تملك الصلاحيات الكافية للوصول إلى هذا المحتوى
                </p>
              </CardContent>
            </Card>
          )}
          {isManagerOrAdmin && (
            <Card className="mb-6 border-amber-200 dark:border-amber-700 shadow-md">
              <CardHeader className="bg-amber-50 dark:bg-amber-950/20">
                <CardTitle className="flex items-center text-amber-800 dark:text-amber-300">
                  <Lock className="ml-2 h-5 w-5" />
                  مستندات المدراء الخاصة
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-400/80">
                  هذا القسم مخصص للمستندات الإدارية السرية والحساسة
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-2">
                <div className="bg-amber-50/50 dark:bg-amber-950/10 p-4 rounded-lg border border-amber-100 dark:border-amber-800/30 mb-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                    المستندات المرفوعة هنا ستكون مرئية فقط للمدراء والمشرفين. استخدم هذا القسم للمستندات الحساسة مثل:
                  </p>
                  <ul className="mt-2 space-y-1.5 text-amber-700 dark:text-amber-300 list-disc pr-5 text-sm">
                    <li>عقود العمل</li>
                    <li>الميزانيات التفصيلية</li>
                    <li>تقارير الأداء</li>
                    <li>الخطط الاستراتيجية</li>
                    <li>المستندات المالية الداخلية</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="attachments" className="p-0">
          {/* محتوى مرفقات المعاملات */}
          <Card className="mb-6">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center">
                <FileImage className="ml-2 h-5 w-5 text-primary" />
                مرفقات المعاملات المالية
              </CardTitle>
              <CardDescription>
                عرض الملفات المرفقة بالمعاملات المالية المختلفة حسب المشروع
              </CardDescription>
            </CardHeader>
          </Card>
          
          {transactionsLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-muted-foreground">جاري تحميل مرفقات المعاملات...</p>
            </div>
          ) : !transactionsWithAttachments || transactionsWithAttachments.length === 0 ? (
            <div className="text-center py-20 bg-secondary/10 rounded-lg">
              <FileImage className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
              <p className="text-muted-foreground mt-4">لا توجد معاملات بمرفقات حتى الآن</p>
              <p className="text-sm text-muted-foreground mt-2">يمكنك إضافة مرفقات للمعاملات من خلال نموذج المعاملات</p>
            </div>
          ) : (
            <div>
              {/* تجميع المعاملات حسب المشروع والسنة */}
              {(() => {
                // تنظيم المعاملات حسب المشروع
                const attachmentsByProject: Record<string, Transaction[]> = {};
                const projectYears: Record<string, Set<number>> = {};
                
                transactionsWithAttachments.forEach(transaction => {
                  const projectId = transaction.projectId || 0;
                  const projectKey = `project-${projectId}`;
                  const transactionYear = new Date(transaction.date).getFullYear();
                  
                  if (!attachmentsByProject[projectKey]) {
                    attachmentsByProject[projectKey] = [];
                  }
                  
                  if (!projectYears[projectKey]) {
                    projectYears[projectKey] = new Set<number>();
                  }
                  
                  projectYears[projectKey].add(transactionYear);
                  attachmentsByProject[projectKey].push(transaction);
                });
                
                // إنشاء بطاقات المشاريع مع تبويبات لسنوات المعاملات
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4 sm:gap-5 lg:gap-6">
                    {Object.keys(attachmentsByProject).map(projectKey => {
                      const projectId = parseInt(projectKey.split('-')[1]);
                      const projectTransactions = attachmentsByProject[projectKey];
                      const projectName = projects?.find(p => p.id === projectId)?.name || 'الصندوق العام';
                      const years = Array.from(projectYears[projectKey]).sort().reverse();
                      
                      return (
                        <Card key={projectKey} className="overflow-hidden border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader className="bg-primary/5 p-2 sm:p-3 md:p-4 pb-1.5 sm:pb-2 md:pb-3">
                            <CardTitle className="text-sm sm:text-base md:text-lg flex items-center">
                              <i className="fas fa-project-diagram ml-1 sm:ml-1.5 md:ml-2 text-primary"></i>
                              <span className="truncate">{projectName}</span>
                            </CardTitle>
                            <CardDescription className="text-xs md:text-sm">
                              {projectTransactions.length} {projectTransactions.length === 1 ? 'مرفق' : 'مرفقات'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-0">
                            <Tabs defaultValue={years[0]?.toString()}>
                              <TabsList className="w-full justify-start p-1.5 sm:p-2 bg-muted/20 overflow-x-auto flex-nowrap no-scrollbar">
                                {years.map(year => (
                                  <TabsTrigger key={year} value={year.toString()} className="text-xs whitespace-nowrap flex-shrink-0">
                                    <CalendarIcon2 className="h-3 w-3 ml-0.5 sm:ml-1" />
                                    {year}
                                  </TabsTrigger>
                                ))}
                              </TabsList>
                              
                              {years.map(year => (
                                <TabsContent key={year} value={year.toString()} className="p-4">
                                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                                    {projectTransactions
                                      .filter(t => new Date(t.date).getFullYear() === year)
                                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                      .map(transaction => {
                                        const isImage = transaction.fileType?.includes('image');
                                        const isPdf = transaction.fileType?.includes('pdf');
                                        
                                        return (
                                          <div 
                                            key={transaction.id} 
                                            className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 xs:p-2.5 sm:p-3 hover:shadow-sm transition-shadow"
                                          >
                                            <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                                              <div className="overflow-hidden">
                                                <h4 className="font-medium text-xs sm:text-sm flex flex-wrap items-center">
                                                  {getFileTypeIcon(transaction.fileType || '')}
                                                  <span className="mr-1">
                                                    {new Date(transaction.date).toLocaleDateString('ar-SA')}
                                                  </span>
                                                  <Badge 
                                                    variant="outline" 
                                                    className={`mr-1 xs:mr-2 truncate text-[10px] xs:text-xs ${transaction.type === 'income' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'}`}
                                                  >
                                                    {transaction.type === 'income' ? 'إيراد' : 'مصروف'}
                                                  </Badge>
                                                </h4>
                                                <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 xs:mt-1 line-clamp-2">
                                                  {transaction.description}
                                                </p>
                                                <p className="text-[10px] xs:text-xs font-medium mt-0.5 xs:mt-1">
                                                  <span className={transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                                                    {transaction.amount.toLocaleString('ar-SA')} ريال
                                                  </span>
                                                </p>
                                              </div>
                                              
                                              {isImage && transaction.fileUrl && (
                                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0 mr-1 xs:mr-0">
                                                  <img
                                                    src={transaction.fileUrl}
                                                    alt="مرفق المعاملة"
                                                    className="h-full w-full object-cover"
                                                  />
                                                </div>
                                              )}
                                              
                                              {!isImage && (
                                                <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center shrink-0 mr-1 xs:mr-0">
                                                  {isPdf ? (
                                                    <File className="h-7 w-7 sm:h-9 sm:w-9 text-destructive" />
                                                  ) : (
                                                    <FileText className="h-7 w-7 sm:h-9 sm:w-9 text-primary" />
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                            
                                            <div className="flex justify-end space-x-1 sm:space-x-2 space-x-reverse mt-1.5 sm:mt-2">
                                              {transaction.fileUrl && (
                                                <>
                                                  <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => window.open(transaction.fileUrl, '_blank')}
                                                    className="h-6 xs:h-7 sm:h-8 text-[10px] xs:text-xs px-1.5 xs:px-2 sm:px-3"
                                                  >
                                                    <Eye className="h-2.5 w-2.5 xs:h-3 xs:w-3 ml-0.5 sm:ml-1" />
                                                    <span className="sm:inline hidden">عرض</span>
                                                  </Button>
                                                  <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => {
                                                      const a = document.createElement('a');
                                                      a.href = transaction.fileUrl!;
                                                      a.download = `مرفق_معاملة_${transaction.id}`;
                                                      a.target = '_blank';
                                                      document.body.appendChild(a);
                                                      a.click();
                                                      document.body.removeChild(a);
                                                    }}
                                                    className="h-6 xs:h-7 sm:h-8 text-[10px] xs:text-xs px-1.5 xs:px-2 sm:px-3"
                                                  >
                                                    <Download className="h-2.5 w-2.5 xs:h-3 xs:w-3 ml-0.5 sm:ml-1" />
                                                    <span className="sm:inline hidden">تنزيل</span>
                                                  </Button>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </TabsContent>
                              ))}
                            </Tabs>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* شريط نتائج الفلترة */}
      {(filter.searchQuery || filter.projectId || filter.fileType || filter.dateRange?.from || filter.dateRange?.to) && (
        <div className="bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/10 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
          <div className="flex items-center">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-[hsl(var(--primary))] ml-1 sm:ml-2" />
            <span className="font-medium text-xs sm:text-sm">نتائج البحث: </span>
            <span className="mr-1 sm:mr-2 text-xs sm:text-sm">{getActiveDocuments()?.length || 0} مستند</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter({})}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-xs sm:text-sm h-8 px-2 sm:px-3"
          >
            إعادة ضبط الفلاتر
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="md:col-span-2 space-y-6 sm:space-y-8">
          {/* Mobile Document View */}
          <div className="block md:hidden space-y-4 sm:space-y-6 fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-lg sm:text-xl font-bold text-[hsl(var(--primary))]">
                {activeTab === "manager" ? "مستندات المدراء" : "المستندات"}
                {activeTab === "manager" && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 mr-1.5 sm:mr-2">
                    <Lock className="ml-0.5 xs:ml-1 h-2.5 w-2.5 xs:h-3 xs:w-3" />
                    <span className="text-[10px] xs:text-xs">مقيد</span>
                  </Badge>
                )}
              </h3>
              {getActiveDocuments() && (
                <span className="bg-[hsl(var(--primary))] text-white text-[10px] xs:text-xs rounded-full px-2 xs:px-3 py-0.5 xs:py-1">
                  {getActiveDocuments().length} مستند
                </span>
              )}
            </div>
            
            {isActiveTabLoading() ? (
              <div className="text-center py-10 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl shadow-sm">
                <div className="spinner w-10 h-10 mx-auto"></div>
                <p className="mt-4 text-[hsl(var(--muted-foreground))]">جاري تحميل المستندات...</p>
              </div>
            ) : getActiveDocuments()?.length === 0 ? (
              <div className="text-center py-12 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl shadow-sm">
                <div className="text-5xl mb-4 opacity-20">📁</div>
                <p className="text-[hsl(var(--foreground))] font-medium">لا توجد مستندات</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">قم برفع مستند جديد للبدء</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getActiveDocuments()?.map((doc: Document) => {
                  const projectName = projects?.find((p: Project) => p.id === doc.projectId)?.name || 'عام';
                  return (
                    <div 
                      key={doc.id} 
                      className={`bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl p-5 hover:shadow-md transition-all duration-300 ${doc.isManagerDocument ? 'border-amber-300 bg-amber-50/30' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-[hsl(var(--foreground))]">
                          {doc.name}
                          {doc.isManagerDocument && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 mr-2">
                              <Lock className="ml-1 h-3 w-3" />
                              مستند إداري
                            </Badge>
                          )}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getFileTypeBadgeClasses(doc.fileType)}`}>
                          {getFileTypeIcon(doc.fileType)}
                          <span className="mr-1">{getFileTypeLabel(doc.fileType)}</span>
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">{doc.description}</p>
                      )}
                      <div className="flex items-center space-x-4 space-x-reverse text-xs text-[hsl(var(--muted-foreground))]">
                        <p className="flex items-center space-x-1 space-x-reverse">
                          <i className="fas fa-folder-open"></i>
                          <span className="font-medium text-primary">{projectName}</span>
                        </p>
                        <p className="flex items-center space-x-1 space-x-reverse">
                          <i className="fas fa-calendar-alt"></i>
                          <span>{new Date(doc.uploadDate).toLocaleDateString('ar-SA')}</span>
                        </p>
                      </div>
                      <div className="mt-4 flex justify-end space-x-2 space-x-reverse">
                        <button 
                          className="text-xs py-2 px-3 rounded-lg bg-[hsl(var(--primary))] text-white font-medium hover:opacity-90 transition-opacity"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                        >
                          <i className="fas fa-eye ml-1"></i>
                          عرض
                        </button>
                        <button 
                          className="text-xs py-2 px-3 rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] font-medium hover:opacity-90 transition-opacity"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = doc.fileUrl;
                            link.download = doc.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <i className="fas fa-download ml-1"></i>
                          تنزيل
                        </button>
                        <button 
                          className="text-xs py-2 px-3 rounded-lg bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors"
                          onClick={async () => {
                            if(confirm('هل أنت متأكد من رغبتك في حذف هذا المستند؟')) {
                              try {
                                // أولاً محاولة حذف الملف من Firebase Storage
                                try {
                                  const { deleteFile } = await import('@/lib/firebase-storage');
                                  if (doc.fileUrl) {
                                    await deleteFile(doc.fileUrl);
                                  }
                                } catch (error) {
                                  console.error("فشل في حذف الملف من التخزين:", error);
                                  // نستمر في الحذف من قاعدة البيانات حتى لو فشل حذف الملف
                                }
                                
                                // ثم حذف السجل من قاعدة البيانات
                                await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' });
                                handleDocumentUpdated();
                              } catch (error) {
                                alert('حدث خطأ أثناء حذف المستند. يرجى المحاولة مرة أخرى.');
                                console.error(error);
                              }
                            }
                          }}
                        >
                          <i className="fas fa-trash-alt ml-1"></i>
                          حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Desktop Document List */}
          <div className="hidden md:block fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[hsl(var(--primary))]">
                {activeTab === "manager" ? "مستندات المدراء" : "المستندات"}
                {activeTab === "manager" && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 mr-2 px-2 py-1">
                    <Lock className="ml-1 h-3 w-3" />
                    منطقة مقيدة
                  </Badge>
                )}
              </h3>
              {getActiveDocuments() && (
                <span className="bg-[hsl(var(--primary))] text-white text-xs rounded-full px-3 py-1">
                  {getActiveDocuments().length} مستند
                </span>
              )}
            </div>
            <DocumentList 
              documents={getActiveDocuments()} 
              projects={projects || []} 
              isLoading={isActiveTabLoading() || projectsLoading}
              onDocumentUpdated={handleDocumentUpdated}
              isManagerSection={activeTab === "manager"}
              searchQuery={filter.searchQuery}
            />
          </div>
        </div>
        
        <div className="space-y-8">
          {/* Document Form */}
          {user?.role !== 'viewer' && (
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4 xs:p-5 sm:p-6 rounded-xl shadow-sm fade-in">
              <h3 className="text-base xs:text-lg sm:text-xl font-bold text-[hsl(var(--primary))] mb-3 sm:mb-5 flex items-center flex-wrap space-x-1 xs:space-x-2 space-x-reverse">
                <i className="fas fa-file-upload text-[hsl(var(--primary))]"></i>
                <span>رفع مستند جديد</span>
                {activeTab === "manager" && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 mr-1 xs:mr-1.5 sm:mr-2 mt-0.5 xs:mt-0">
                    <Lock className="ml-0.5 xs:ml-1 h-2.5 w-2.5 xs:h-3 xs:w-3" />
                    <span className="text-[10px] xs:text-xs">إداري</span>
                  </Badge>
                )}
              </h3>
              <DocumentForm 
                projects={projects || []} 
                onSubmit={handleDocumentUpdated} 
                isLoading={projectsLoading}
                isManagerDocument={activeTab === "manager"}
              />
            </div>
          )}
          
          {/* Filter */}
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4 xs:p-5 sm:p-6 rounded-xl shadow-sm slide-in-right">
            <h3 className="text-base xs:text-lg sm:text-xl font-bold text-[hsl(var(--primary))] mb-3 sm:mb-5 flex items-center space-x-1 xs:space-x-2 space-x-reverse">
              <i className="fas fa-filter text-[hsl(var(--primary))]"></i>
              <span>تصفية المستندات</span>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {/* حقل البحث */}
              <div>
                <Label htmlFor="searchQuery" className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">البحث</Label>
                <div className="relative">
                  <Search className="absolute right-2.5 top-[9px] h-3.5 w-3.5 sm:right-3 sm:top-2.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    id="searchQuery"
                    placeholder="ابحث في المستندات..."
                    className="pr-8 xs:pr-9 sm:pr-10 w-full h-8 xs:h-9 sm:h-10 text-xs sm:text-sm"
                    value={filter.searchQuery || ''}
                    onChange={(e) => handleFilterChange({ searchQuery: e.target.value || undefined })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="filterProject" className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">حسب المشروع</Label>
                <Select 
                  onValueChange={(value) => handleFilterChange({ projectId: value === "all" ? undefined : parseInt(value) })}
                  value={filter.projectId?.toString() || "all"}
                >
                  <SelectTrigger id="filterProject" className="w-full h-8 xs:h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="كل المشاريع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs sm:text-sm">كل المشاريع</SelectItem>
                    {!projectsLoading && projects?.map((project: Project) => (
                      <SelectItem key={project.id} value={project.id.toString()} className="text-xs sm:text-sm">
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* فلتر نوع الملف */}
              <div>
                <Label htmlFor="filterFileType" className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">حسب نوع الملف</Label>
                <Select 
                  onValueChange={(value) => handleFilterChange({ fileType: value === "all" ? undefined : value })}
                  value={filter.fileType || "all"}
                >
                  <SelectTrigger id="filterFileType" className="w-full h-8 xs:h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="كل أنواع الملفات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs sm:text-sm">كل أنواع الملفات</SelectItem>
                    <SelectItem value="pdf" className="text-xs sm:text-sm">PDF</SelectItem>
                    <SelectItem value="image" className="text-xs sm:text-sm">صور</SelectItem>
                    <SelectItem value="document" className="text-xs sm:text-sm">مستندات</SelectItem>
                    <SelectItem value="other" className="text-xs sm:text-sm">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* فلتر بحسب التاريخ */}
              <div className="space-y-1 sm:space-y-2">
                <Label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">حسب التاريخ</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full h-8 xs:h-9 sm:h-10 justify-start text-right text-xs sm:text-sm"
                      >
                        <CalendarIcon className="ml-1 xs:ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        {filter.dateRange?.from ? (
                          format(filter.dateRange.from, "yyyy/MM/dd", { locale: ar })
                        ) : (
                          <span className="truncate">تاريخ البداية</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filter.dateRange?.from || undefined}
                        onSelect={(date) => {
                          handleFilterChange({
                            dateRange: {
                              from: date || undefined,
                              to: filter.dateRange?.to || undefined
                            }
                          });
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full h-8 xs:h-9 sm:h-10 justify-start text-right text-xs sm:text-sm"
                      >
                        <CalendarIcon className="ml-1 xs:ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        {filter.dateRange?.to ? (
                          format(filter.dateRange.to, "yyyy/MM/dd", { locale: ar })
                        ) : (
                          <span className="truncate">تاريخ النهاية</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filter.dateRange?.to || undefined}
                        onSelect={(date) => {
                          handleFilterChange({
                            dateRange: {
                              from: filter.dateRange?.from || undefined,
                              to: date || undefined
                            }
                          });
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* زر إعادة ضبط الفلاتر */}
              <Button 
                variant="secondary" 
                className="w-full mt-4"
                onClick={() => setFilter({})}
              >
                <Filter className="ml-2 h-4 w-4" />
                إعادة ضبط الفلاتر
              </Button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
