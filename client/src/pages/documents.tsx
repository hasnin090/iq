import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DocumentForm } from '@/components/document-form';
import { DocumentList } from '@/components/document/document-list';
import { queryClient } from '@/lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from "@/components/ui/badge";
import { Lock, ShieldAlert, FileText, AlertCircle, CalendarIcon, File, FileImage, Clock, Filter, Search, Download, Eye, Calendar as CalendarIcon2, Plus, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { format, addDays } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Calendar
} from "@/components/ui/calendar";
import { getMainFileType, getFileTypeIconName, getFileTypeLabel, getFileTypeBadgeClasses } from "@/utils/file-utils";
import { EmptyState, SectionHeader, LoadingState } from '@/components/common';
import type { Document, Project } from '@/types';

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
  const [showUploadDialog, setShowUploadDialog] = useState(false);
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
  
  // استخدام الأنواع من ملف الأنواع المشتركة

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
        const type = getMainFileType(doc.fileType);
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
    <div className="container py-3 px-2 xs:px-3 sm:py-4 md:py-6 sm:px-4 mx-auto">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[hsl(var(--primary))]">إدارة المستندات</h2>
        <p className="text-xs sm:text-sm md:text-base text-[hsl(var(--muted-foreground))] mt-1 sm:mt-2">إدارة وتنظيم مستندات المشاريع والملفات المهمة</p>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-start sm:items-center mb-3 sm:mb-4">
          <TabsList className="w-full xs:w-auto grow max-w-md mx-auto sm:mx-0 overflow-hidden rounded-md h-auto">
            <TabsTrigger value="all" className="flex-1 text-xs sm:text-sm h-10 md:h-11 px-3">
              <FileText className="ml-1 sm:ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate">المستندات العامة</span>
            </TabsTrigger>
            {isManagerOrAdmin && (
              <TabsTrigger value="manager" className="flex-1 text-xs sm:text-sm h-10 md:h-11 px-3">
                <Lock className="ml-1 sm:ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">مستندات المدراء</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="attachments" className="flex-1 text-xs sm:text-sm h-10 md:h-11 px-3">
              <FileImage className="ml-1 sm:ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate">مرفقات المعاملات</span>
            </TabsTrigger>
          </TabsList>
          
          {user?.role !== 'viewer' && (
            <Button 
              variant="default" 
              size="sm" 
              className="h-10 md:h-11 w-full xs:w-auto text-xs sm:text-sm rounded-md"
              onClick={() => setShowUploadDialog(true)}
            >
              <Upload className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>رفع مستند جديد</span>
            </Button>
          )}
        </div>
        
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
          <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
            {/* قسم الفلتر والفورم */}
            <div className="space-y-6 sm:space-y-8">

              
              {/* قسم الفلترة */}
              <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4 xs:p-5 sm:p-6 rounded-xl shadow-sm fade-in">
                <h3 className="text-base xs:text-lg sm:text-xl font-bold text-[hsl(var(--primary))] mb-3 sm:mb-5 flex items-center flex-wrap space-x-1 xs:space-x-2 space-x-reverse">
                  <Filter className="h-4 w-4 xs:h-5 xs:w-5 text-[hsl(var(--primary))]" />
                  <span>فلترة المستندات</span>
                </h3>
                
                <div className="flex flex-wrap gap-2 xs:gap-3 sm:gap-4 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <Label htmlFor="searchQuery" className="text-xs xs:text-sm mb-1 block">بحث عن مستند</Label>
                    <div className="relative">
                      <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        id="searchQuery"
                        placeholder="اسم المستند أو الوصف..."
                        value={filter.searchQuery || ''}
                        onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
                        className="pl-2 pr-8 h-8 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="w-full xs:w-auto">
                    <Label htmlFor="projectFilter" className="text-xs xs:text-sm mb-1 block">المشروع</Label>
                    <Select
                      value={filter.projectId?.toString() || ''}
                      onValueChange={(value) => handleFilterChange({ projectId: value ? parseInt(value) : undefined })}
                    >
                      <SelectTrigger id="projectFilter" className="w-full xs:w-[140px] h-8 text-xs sm:text-sm">
                        <SelectValue placeholder="كل المشاريع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل المشاريع</SelectItem>
                        {!projectsLoading && projects?.map((project: Project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-full xs:w-auto">
                    <Label htmlFor="typeFilter" className="text-xs xs:text-sm mb-1 block">نوع الملف</Label>
                    <Select
                      value={filter.fileType || ''}
                      onValueChange={(value) => handleFilterChange({ fileType: value || undefined })}
                    >
                      <SelectTrigger id="typeFilter" className="w-full xs:w-[140px] h-8 text-xs sm:text-sm">
                        <SelectValue placeholder="كل الأنواع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل الأنواع</SelectItem>
                        <SelectItem value="image">صور</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="document">مستندات</SelectItem>
                        <SelectItem value="spreadsheet">جداول بيانات</SelectItem>
                        <SelectItem value="presentation">عروض تقديمية</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-full xs:w-auto mb-0 sm:mb-0">
                    <Label className="text-xs xs:text-sm mb-1 block">تاريخ الرفع</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full xs:w-[200px] justify-start text-right h-8 text-xs sm:text-sm font-normal"
                        >
                          <CalendarIcon className="ml-2 h-3.5 w-3.5" />
                          {filter.dateRange?.from ? (
                            filter.dateRange.to ? (
                              <>
                                من {format(filter.dateRange.from, "PPP", { locale: ar })}
                                <br />
                                إلى {format(filter.dateRange.to, "PPP", { locale: ar })}
                              </>
                            ) : (
                              format(filter.dateRange.from, "PPP", { locale: ar })
                            )
                          ) : (
                            "اختر التاريخ..."
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          selected={{
                            from: filter.dateRange?.from || undefined,
                            to: filter.dateRange?.to || undefined,
                          }}
                          onSelect={(range) =>
                            handleFilterChange({
                              dateRange: {
                                from: range?.from,
                                to: range?.to,
                              },
                            })
                          }
                          locale={ar}
                          className="p-2"
                        />
                        <div className="flex border-t border-border p-2 justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFilterChange({ dateRange: undefined })}
                            className="text-xs sm:text-sm"
                          >
                            إعادة ضبط
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              const today = new Date();
                              const nextWeek = addDays(today, 7);
                              handleFilterChange({
                                dateRange: {
                                  from: today,
                                  to: nextWeek,
                                },
                              });
                            }}
                            className="text-xs sm:text-sm"
                          >
                            آخر أسبوع
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

            {/* قسم العرض */}
            <div className="space-y-6 sm:space-y-8">
              {/* عرض المستندات - نسخة الجوال */}
              <div className="block md:hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-[hsl(var(--primary))]">المستندات العامة</h3>
                  {getActiveDocuments() && (
                    <Badge className="bg-[hsl(var(--primary))] px-2 py-0.5 text-white">
                      {getActiveDocuments().length} مستند
                    </Badge>
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
                          className={`p-4 rounded-lg border shadow-sm hover:shadow transition-shadow ${doc.isManagerDocument ? 'bg-amber-50 border-amber-200' : 'bg-card border-border'}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-base">
                              {doc.name}
                              {doc.isManagerDocument && (
                                <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-300">
                                  <Lock className="h-3 w-3 mr-1" />
                                  <span className="text-xs">إداري</span>
                                </Badge>
                              )}
                            </h4>
                            
                            <Badge className={getFileTypeBadgeClasses(doc.fileType)}>
                              {getFileTypeIconName(doc.fileType)}
                              <span className="mr-1">{getFileTypeLabel(doc.fileType)}</span>
                            </Badge>
                          </div>
                          
                          {doc.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{doc.description}</p>
                          )}
                          
                          <div className="flex items-center text-xs text-muted-foreground space-x-3 space-x-reverse mb-3">
                            <span className="flex items-center">
                              <i className="fas fa-folder-open ml-1"></i>
                              {projectName}
                            </span>
                            <span className="flex items-center">
                              <i className="fas fa-calendar-alt ml-1"></i>
                              {new Date(doc.uploadDate).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                          
                          <div className="flex justify-end space-x-2 space-x-reverse">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                            >
                              <Eye className="ml-1 h-3 w-3" />
                              عرض
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = doc.fileUrl;
                                link.download = doc.name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="ml-1 h-3 w-3" />
                              تحميل
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="text-xs"
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
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* عرض المستندات - نسخة سطح المكتب */}
              <div className="hidden md:block">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-[hsl(var(--primary))]">المستندات العامة</h3>
                  {getActiveDocuments() && (
                    <Badge className="bg-[hsl(var(--primary))] px-2 py-0.5 text-white">
                      {getActiveDocuments().length} مستند
                    </Badge>
                  )}
                </div>
                
                <DocumentList 
                  documents={getActiveDocuments()} 
                  projects={projects || []} 
                  isLoading={isActiveTabLoading() || projectsLoading}
                  onDocumentUpdated={handleDocumentUpdated}
                  isManagerSection={false}
                  searchQuery={filter.searchQuery}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="manager" className="p-0">
          {/* مستندات المدراء */}
          {isManagerOrAdmin && (
            <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
              {/* قسم الفلتر والفورم */}
              <div className="space-y-6 sm:space-y-8">
                {/* معلومات مستندات المدراء */}
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 xs:p-5 sm:p-6 rounded-xl shadow-sm slide-in-left">
                  <h3 className="text-base xs:text-lg sm:text-xl font-bold text-amber-800 dark:text-amber-400 mb-3 sm:mb-5 flex items-center flex-wrap space-x-1 xs:space-x-2 space-x-reverse">
                    <Lock className="h-4 w-4 xs:h-5 xs:w-5 text-amber-600 dark:text-amber-500" />
                    <span>مستندات إدارية</span>
                    <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/60 mr-1 xs:mr-1.5 sm:mr-2 mt-0.5 xs:mt-0">
                      <Lock className="ml-0.5 xs:ml-1 h-2.5 w-2.5 xs:h-3 xs:w-3" />
                      <span className="text-[10px] xs:text-xs">مقيّد</span>
                    </Badge>
                  </h3>
                  <div className="mb-4 bg-amber-100 dark:bg-amber-900/60 border-r-4 border-amber-500 dark:border-amber-600 p-3 rounded-tr rounded-br text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                    <AlertCircle className="inline-flex ml-1.5 h-4 w-4" />
                    المستندات الإدارية مرئية فقط للمدراء والمسؤولين. استخدم هذا القسم لتخزين المستندات السرية والحساسة.
                  </div>
                  <div className="flex justify-center mt-4">
                    <Button 
                      variant="outline" 
                      className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60"
                      onClick={() => setShowUploadDialog(true)}
                    >
                      <Upload className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>رفع مستند إداري جديد</span>
                    </Button>
                  </div>
                </div>
                
                {/* قسم الفلترة */}
                <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4 xs:p-5 sm:p-6 rounded-xl shadow-sm slide-in-right">
                  <h3 className="text-base xs:text-lg sm:text-xl font-bold text-[hsl(var(--primary))] mb-3 sm:mb-5 flex items-center flex-wrap space-x-1 xs:space-x-2 space-x-reverse">
                    <Filter className="h-4 w-4 xs:h-5 xs:w-5 text-[hsl(var(--primary))]" />
                    <span>فلترة المستندات الإدارية</span>
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 xs:gap-3 sm:gap-4 items-end">
                    <div className="flex-1 min-w-[140px]">
                      <Label htmlFor="searchQuery" className="text-xs xs:text-sm mb-1 block">بحث عن مستند</Label>
                      <div className="relative">
                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          id="searchQuery"
                          placeholder="اسم المستند أو الوصف..."
                          value={filter.searchQuery || ''}
                          onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
                          className="pl-2 pr-8 h-8 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="w-full xs:w-auto">
                      <Label htmlFor="projectFilter" className="text-xs xs:text-sm mb-1 block">المشروع</Label>
                      <Select
                        value={filter.projectId?.toString() || 'all'}
                        onValueChange={(value) => handleFilterChange({ projectId: value !== 'all' ? parseInt(value) : undefined })}
                      >
                        <SelectTrigger id="projectFilter" className="w-full xs:w-[140px] h-8 text-xs sm:text-sm">
                          <SelectValue placeholder="كل المشاريع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">كل المشاريع</SelectItem>
                          {!projectsLoading && projects?.map((project: Project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-full xs:w-auto">
                      <Label htmlFor="typeFilter" className="text-xs xs:text-sm mb-1 block">نوع الملف</Label>
                      <Select
                        value={filter.fileType || 'all'}
                        onValueChange={(value) => handleFilterChange({ fileType: value === 'all' ? undefined : value })}
                      >
                        <SelectTrigger id="typeFilter" className="w-full xs:w-[140px] h-8 text-xs sm:text-sm">
                          <SelectValue placeholder="كل الأنواع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">كل الأنواع</SelectItem>
                          <SelectItem value="image">صور</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="document">مستندات</SelectItem>
                          <SelectItem value="spreadsheet">جداول بيانات</SelectItem>
                          <SelectItem value="presentation">عروض تقديمية</SelectItem>
                          <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-full xs:w-auto mb-0 sm:mb-0">
                      <Label className="text-xs xs:text-sm mb-1 block">تاريخ الرفع</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full xs:w-[200px] justify-start text-right h-8 text-xs sm:text-sm font-normal"
                          >
                            <CalendarIcon className="ml-2 h-3.5 w-3.5" />
                            {filter.dateRange?.from ? (
                              filter.dateRange.to ? (
                                <>
                                  من {format(filter.dateRange.from, "PPP", { locale: ar })}
                                  <br />
                                  إلى {format(filter.dateRange.to, "PPP", { locale: ar })}
                                </>
                              ) : (
                                format(filter.dateRange.from, "PPP", { locale: ar })
                              )
                            ) : (
                              "اختر التاريخ..."
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            selected={{
                              from: filter.dateRange?.from || undefined,
                              to: filter.dateRange?.to || undefined,
                            }}
                            onSelect={(range) =>
                              handleFilterChange({
                                dateRange: {
                                  from: range?.from,
                                  to: range?.to,
                                },
                              })
                            }
                            locale={ar}
                            className="p-2"
                          />
                          <div className="flex border-t border-border p-2 justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFilterChange({ dateRange: undefined })}
                              className="text-xs sm:text-sm"
                            >
                              إعادة ضبط
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                const today = new Date();
                                const nextWeek = addDays(today, 7);
                                handleFilterChange({
                                  dateRange: {
                                    from: today,
                                    to: nextWeek,
                                  },
                                });
                              }}
                              className="text-xs sm:text-sm"
                            >
                              آخر أسبوع
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>

              {/* قسم العرض */}
              <div className="space-y-6 sm:space-y-8">
                {/* عرض المستندات */}
                <div className="block">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-amber-700 dark:text-amber-500 flex items-center space-x-2 space-x-reverse">
                      <Lock className="ml-1.5 h-4 w-4" />
                      <span>مستندات المدراء</span>
                      <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/60 mr-2">
                        منطقة مقيدة
                      </Badge>
                    </h3>
                    {managerDocuments && (
                      <Badge className="bg-amber-600 dark:bg-amber-700 px-2 py-0.5 text-white">
                        {managerDocuments.length} مستند
                      </Badge>
                    )}
                  </div>

                  <DocumentList 
                    documents={getActiveDocuments()} 
                    projects={projects || []} 
                    isLoading={isActiveTabLoading() || projectsLoading}
                    onDocumentUpdated={handleDocumentUpdated}
                    isManagerSection={true}
                    searchQuery={filter.searchQuery}
                  />
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="attachments" className="p-0">
          {/* مرفقات المعاملات */}
          <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
            {/* عنوان القسم */}
            <div className="bg-[hsl(var(--primary))] text-white p-4 xs:p-5 sm:p-6 rounded-xl shadow-sm mb-2 slide-in-right">
              <h3 className="text-base xs:text-lg sm:text-xl font-bold mb-1 sm:mb-2 flex items-center">
                <FileImage className="ml-2 h-5 w-5" />
                مرفقات المعاملات المالية
              </h3>
              <p className="text-xs sm:text-sm opacity-90">
                عرض جميع المرفقات والمستندات الداعمة للمعاملات المالية في النظام
              </p>
            </div>
            
            {/* قائمة المرفقات */}
            <div className="space-y-5">
              {transactionsLoading ? (
                <div className="text-center py-16 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl shadow-sm">
                  <div className="spinner w-12 h-12 mx-auto"></div>
                  <p className="mt-4 text-[hsl(var(--muted-foreground))]">جاري تحميل مرفقات المعاملات...</p>
                </div>
              ) : transactionsWithAttachments?.length === 0 ? (
                <div className="text-center py-16 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl shadow-sm">
                  <div className="text-6xl mb-4 opacity-20">🔍</div>
                  <p className="text-lg font-medium mb-1">لا توجد مرفقات للمعاملات</p>
                  <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
                    لا يوجد حالياً أي معاملات مالية تحتوي على مرفقات في النظام. يمكنك إضافة مرفقات عند إنشاء معاملات جديدة.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {transactionsWithAttachments?.map((transaction: Transaction) => {
                    const projectName = projects?.find(p => p.id === transaction.projectId)?.name || 'بدون مشروع';
                    return (
                      <Card key={transaction.id} className="overflow-hidden border border-border">
                        <CardHeader className="p-4 bg-[hsl(var(--muted))]">
                          <div className="flex justify-between items-center">
                            <Badge className={transaction.type === 'deposit' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-orange-100 text-orange-800 border-orange-300'}>
                              {transaction.type === 'deposit' ? 'إيداع' : 'سحب'}
                            </Badge>
                            <Badge className={getFileTypeBadgeClasses(transaction.fileType || '')}>
                              {getFileTypeIconName(transaction.fileType || '')}
                              <span className="mr-1">{getFileTypeLabel(transaction.fileType || '')}</span>
                            </Badge>
                          </div>
                          <CardTitle className="text-base mt-2 mb-0">
                            {new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(transaction.amount)}
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-1">
                            {transaction.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 space-x-reverse text-xs text-muted-foreground mb-3">
                            <span className="flex items-center">
                              <i className="fas fa-folder-open ml-1"></i>
                              {projectName}
                            </span>
                            <span className="flex items-center">
                              <i className="fas fa-calendar-alt ml-1"></i>
                              {new Date(transaction.date).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                          
                          <div className="flex justify-between mt-3">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => window.open(transaction.fileUrl, '_blank')}
                            >
                              <Eye className="ml-1 h-3 w-3" />
                              عرض المرفق
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-xs"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = transaction.fileUrl || '';
                                link.download = `مرفق_معاملة_${transaction.id}`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="ml-1 h-3 w-3" />
                              تحميل
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      {/* نافذة منبثقة لرفع مستند جديد */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-xl mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-[hsl(var(--primary))] font-bold flex items-center">
              <Upload className="ml-2 h-5 w-5" />
              <span>رفع مستند جديد</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              قم بإضافة ملف جديد لأرشيف المستندات
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <DocumentForm 
              projects={projects || []} 
              onSubmit={() => {
                handleDocumentUpdated();
                setShowUploadDialog(false);
              }} 
              isLoading={projectsLoading}
              isManagerDocument={activeTab === "manager"}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}