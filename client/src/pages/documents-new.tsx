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
import { Lock, Search, CalendarIcon, FileText, Download, Eye, Trash2 } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { getFileType } from "@/lib/firebase-storage";
import { getFileTypeLabel, getFileTypeBadgeClasses } from "@/lib/file-helpers";

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

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
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
    return activeTab === "manager" ? managerDocumentsLoading : documentsLoading;
  };

  // وظائف المساعدة
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const previewFile = (doc: Document) => {
    window.open(doc.fileUrl, '_blank');
  };

  const downloadFile = (fileUrl: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClick = async (doc: Document) => {
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
  };
  
  return (
    <div className="py-3 px-2 sm:py-4 md:py-6 sm:px-4">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[hsl(var(--primary))]">إدارة المستندات</h2>
        <p className="text-xs sm:text-sm md:text-base text-[hsl(var(--muted-foreground))] mt-1 sm:mt-2">إدارة وتنظيم مستندات المشاريع والملفات المهمة</p>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full mb-6 sm:mb-8">
        <TabsList className="w-full max-w-md mb-3 sm:mb-4 mx-auto">
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
        </TabsList>
      </Tabs>

      <div className="md:grid md:grid-cols-12 gap-4 sm:gap-6">
        {/* صف الأدوات العلوي - لعرض سطح المكتب فقط */}
        <div className="hidden md:block md:col-span-12 mb-2">
          <div className="grid grid-cols-5 gap-4">
            {/* بطاقة الإحصائيات */}
            <div className="col-span-3">
              <Card className="flex items-center h-full bg-[hsl(var(--primary))]/5">
                <CardContent className="p-4 w-full">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <i className="fas fa-file-alt text-[hsl(var(--primary))] ml-3 text-xl"></i>
                      <div>
                        <h3 className="text-lg font-bold text-[hsl(var(--primary))]">
                          {activeTab === "manager" ? "مستندات المدراء" : "المستندات"}
                          {activeTab === "manager" && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 mr-2 px-2 py-0.5">
                              <Lock className="ml-1 h-3 w-3" />
                              <span className="text-[10px]">مقيد</span>
                            </Badge>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          إدارة وتنظيم جميع ملفات ومستندات المشاريع
                        </p>
                      </div>
                    </div>
                    {getActiveDocuments() && (
                      <span className="bg-[hsl(var(--primary))] text-white text-xs rounded-full px-3 py-1">
                        {getActiveDocuments().length} مستند
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* بطاقة البحث */}
            <div className="col-span-2">
              <Card className="h-full bg-[hsl(var(--primary))]/5">
                <CardContent className="p-4 flex items-center">
                  <div className="relative w-full">
                    <Input
                      id="quickSearch"
                      value={filter.searchQuery || ''}
                      onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
                      placeholder="ابحث في المستندات..."
                      className="pl-3 pr-9 border-primary/30 focus:border-primary/70"
                    />
                    <Search className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-primary/70" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* عنوان الصفحة للموبايل */}
        <div className="md:hidden mb-4">
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
        </div>
        
        {/* شريط الأدوات - العرض الكامل (من الجهاز اللوحي فما فوق) */}
        <div className="md:col-span-12">
          <div className="flex flex-col md:flex-row gap-4">
            {/* فورم الرفع (محدد بعرض ثابت) */}
            {user?.role !== 'viewer' && (
              <div className="md:w-[280px] lg:w-[320px] xl:w-[360px]">
                <Card className="h-full shadow-sm">
                  <CardHeader className="p-3 bg-[hsl(var(--primary))]/5 border-b border-[hsl(var(--primary))]/10">
                    <CardTitle className="text-sm lg:text-base flex items-center gap-2">
                      <i className="fas fa-file-upload"></i>
                      <span className="truncate">إضافة مستند</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <DocumentForm 
                      projects={projects || []} 
                      onSubmit={handleDocumentUpdated} 
                      isLoading={projectsLoading}
                      isManagerDocument={activeTab === "manager"}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* أدوات التصفية - قسم متوازن */}
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                {/* تصفية حسب المشروع */}
                <div className="sm:col-span-1">
                  <Card className="h-full bg-[hsl(var(--muted))]/30">
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <i className="fas fa-project-diagram text-primary/70"></i>
                        <span>حسب المشروع</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <Select 
                        value={filter.projectId?.toString() || "all"} 
                        onValueChange={(value) => handleFilterChange({ projectId: value === "all" ? undefined : parseInt(value) })}
                      >
                        <SelectTrigger id="projectFilter" className="w-full">
                          <SelectValue placeholder="كل المشاريع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">كل المشاريع</SelectItem>
                          {projects?.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>
                
                {/* تصفية حسب نوع الملف */}
                <div className="sm:col-span-1">
                  <Card className="h-full bg-[hsl(var(--muted))]/30">
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <i className="fas fa-file-alt text-primary/70"></i>
                        <span>نوع الملف</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <Select 
                        value={filter.fileType || "all"} 
                        onValueChange={(value) => handleFilterChange({ fileType: value === "all" ? undefined : value })}
                      >
                        <SelectTrigger id="fileTypeFilter" className="w-full">
                          <SelectValue placeholder="كل أنواع الملفات" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">كل أنواع الملفات</SelectItem>
                          <SelectItem value="image">صور</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="document">مستندات</SelectItem>
                          <SelectItem value="spreadsheet">جداول بيانات</SelectItem>
                          <SelectItem value="presentation">عروض تقديمية</SelectItem>
                          <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>
                
                {/* تصفية حسب التاريخ */}
                <div className="lg:col-span-1 sm:col-span-2">
                  <Card className="h-full bg-[hsl(var(--muted))]/30">
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-calendar-alt text-primary/70"></i>
                          <span>حسب التاريخ</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFilter({})}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <i className="fas fa-redo-alt ml-1"></i>
                          إعادة ضبط
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`w-full justify-between text-xs ${filter.dateRange?.from ? 'text-foreground' : 'text-muted-foreground'}`}
                            >
                              {filter.dateRange?.from ? format(filter.dateRange.from, 'yyyy/MM/dd', { locale: ar }) : 'من'}
                              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={filter.dateRange?.from || undefined}
                              onSelect={(date) => handleFilterChange({ 
                                dateRange: { 
                                  from: date || null, 
                                  to: filter.dateRange?.to || null 
                                } 
                              })}
                              initialFocus
                              locale={ar}
                            />
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`w-full justify-between text-xs ${filter.dateRange?.to ? 'text-foreground' : 'text-muted-foreground'}`}
                            >
                              {filter.dateRange?.to ? format(filter.dateRange.to, 'yyyy/MM/dd', { locale: ar }) : 'إلى'}
                              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={filter.dateRange?.to || undefined}
                              onSelect={(date) => handleFilterChange({ 
                                dateRange: { 
                                  from: filter.dateRange?.from || null, 
                                  to: date || null 
                                } 
                              })}
                              initialFocus
                              locale={ar}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
          
        {/* قسم عرض المستندات */}
        <div className="md:col-span-12 mt-2">
          {/* عرض الموبايل */}
          <div className="block md:hidden space-y-4 sm:space-y-6 fade-in">
            {isActiveTabLoading() ? (
              <div className="text-center py-10 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl shadow-sm">
                <div className="animate-spin h-10 w-10 mx-auto border-t-2 border-b-2 border-primary rounded-full"></div>
                <p className="mt-4 text-[hsl(var(--muted-foreground))]">جاري تحميل المستندات...</p>
              </div>
            ) : getActiveDocuments()?.length === 0 ? (
              <div className="text-center py-12 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl shadow-sm">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
                <p className="text-[hsl(var(--foreground))] font-medium mt-4">لا توجد مستندات</p>
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
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 mr-1.5 px-1.5 py-0.5">
                              <Lock className="ml-0.5 h-2 w-2" />
                              <span className="text-[10px]">إداري</span>
                            </Badge>
                          )}
                        </h4>
                        
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${getFileTypeBadgeClasses(doc.fileType)}`}>
                          {getFileTypeLabel(doc.fileType)}
                        </span>
                      </div>
                      
                      {doc.description && (
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3 line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                      
                      <div className="flex items-center text-[10px] xs:text-xs text-[hsl(var(--muted-foreground))] mb-4">
                        <div className="flex items-center ml-3">
                          <i className="fas fa-folder-open ml-1 text-primary"></i>
                          {projectName}
                        </div>
                        <div className="flex items-center">
                          <i className="fas fa-calendar-alt ml-1 text-primary"></i>
                          {formatDate(doc.uploadDate)}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => previewFile(doc)}
                          className="text-[10px] xs:text-xs h-7 px-2"
                        >
                          <Eye className="h-3 w-3 ml-1" />
                          معاينة
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => downloadFile(doc.fileUrl)}
                          className="text-[10px] xs:text-xs h-7 px-2"
                        >
                          <Download className="h-3 w-3 ml-1" />
                          تنزيل
                        </Button>
                        {user?.role === 'admin' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-[10px] xs:text-xs h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive/90 border-destructive/30"
                            onClick={() => handleDeleteClick(doc)}
                          >
                            <Trash2 className="h-3 w-3 ml-1" />
                            حذف
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
            
          {/* عرض سطح المكتب */}
          <div className="hidden md:block fade-in">
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
      </div>
    </div>
  );
}