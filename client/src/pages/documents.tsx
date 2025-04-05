import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DocumentForm } from '@/components/document-form';
import { DocumentList } from '@/components/document-list';
import { queryClient } from '@/lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from "@/components/ui/badge";
import { Lock, ShieldAlert, FileText, AlertCircle, CalendarIcon, File, FileImage, Clock, Filter, Search } from 'lucide-react';
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
import { addDays, format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Calendar
} from "@/components/ui/calendar";
import { getFileType } from "@/lib/firebase-storage";
import { getFileTypeLabel, getFileTypeIcon, getFileTypeBadgeClasses } from "@/lib/file-helpers";

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
    if (activeTab === "manager") {
      return managerDocumentsLoading;
    }
    return documentsLoading;
  };
  
  return (
    <div className="py-6 px-4">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--primary))]">إدارة المستندات</h2>
        <p className="text-[hsl(var(--muted-foreground))] mt-2">إدارة وتنظيم مستندات المشاريع والملفات المهمة</p>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full mb-8">
        <TabsList className="w-full max-w-md mb-4 mx-auto">
          <TabsTrigger value="all" className="flex-1">
            <FileText className="ml-1 h-4 w-4" />
            المستندات العامة
          </TabsTrigger>
          {isManagerOrAdmin && (
            <TabsTrigger value="manager" className="flex-1">
              <Lock className="ml-1 h-4 w-4" />
              مستندات المدراء
            </TabsTrigger>
          )}
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
                <p className="text-center text-muted-foreground">
                  لا تملك الصلاحيات الكافية للوصول إلى هذا المحتوى
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* شريط نتائج الفلترة */}
      {(filter.searchQuery || filter.projectId || filter.fileType || filter.dateRange?.from || filter.dateRange?.to) && (
        <div className="bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/10 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-[hsl(var(--primary))] ml-2" />
            <span className="font-medium">نتائج البحث: </span>
            <span className="mr-2">{getActiveDocuments()?.length || 0} مستند</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter({})}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            إعادة ضبط الفلاتر
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Mobile Document View */}
          <div className="block md:hidden space-y-6 fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[hsl(var(--primary))]">
                {activeTab === "manager" ? "مستندات المدراء" : "المستندات"}
                {activeTab === "manager" && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 mr-2">
                    <Lock className="ml-1 h-3 w-3" />
                    مقيد
                  </Badge>
                )}
              </h3>
              {getActiveDocuments() && (
                <span className="bg-[hsl(var(--primary))] text-white text-xs rounded-full px-3 py-1">
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
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-xl shadow-sm fade-in">
              <h3 className="text-xl font-bold text-[hsl(var(--primary))] mb-5 flex items-center space-x-2 space-x-reverse">
                <i className="fas fa-file-upload text-[hsl(var(--primary))]"></i>
                <span>رفع مستند جديد</span>
                {activeTab === "manager" && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 mr-2">
                    <Lock className="ml-1 h-3 w-3" />
                    إداري
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
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-xl shadow-sm slide-in-right">
            <h3 className="text-xl font-bold text-[hsl(var(--primary))] mb-5 flex items-center space-x-2 space-x-reverse">
              <i className="fas fa-filter text-[hsl(var(--primary))]"></i>
              <span>تصفية المستندات</span>
            </h3>
            <div className="space-y-4">
              {/* حقل البحث */}
              <div>
                <Label htmlFor="searchQuery" className="block text-sm font-medium mb-2">البحث</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="searchQuery"
                    placeholder="ابحث في المستندات..."
                    className="pr-10 w-full"
                    value={filter.searchQuery || ''}
                    onChange={(e) => handleFilterChange({ searchQuery: e.target.value || undefined })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="filterProject" className="block text-sm font-medium mb-2">حسب المشروع</Label>
                <Select 
                  onValueChange={(value) => handleFilterChange({ projectId: value === "all" ? undefined : parseInt(value) })}
                  value={filter.projectId?.toString() || "all"}
                >
                  <SelectTrigger id="filterProject" className="w-full">
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
              
              {/* فلتر نوع الملف */}
              <div>
                <Label htmlFor="filterFileType" className="block text-sm font-medium mb-2">حسب نوع الملف</Label>
                <Select 
                  onValueChange={(value) => handleFilterChange({ fileType: value === "all" ? undefined : value })}
                  value={filter.fileType || "all"}
                >
                  <SelectTrigger id="filterFileType" className="w-full">
                    <SelectValue placeholder="كل أنواع الملفات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل أنواع الملفات</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="image">صور</SelectItem>
                    <SelectItem value="document">مستندات</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* فلتر بحسب التاريخ */}
              <div className="space-y-2">
                <Label className="block text-sm font-medium mb-2">حسب التاريخ</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-right"
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {filter.dateRange?.from ? (
                          format(filter.dateRange.from, "yyyy/MM/dd", { locale: ar })
                        ) : (
                          <span>تاريخ البداية</span>
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
                        className="w-full justify-start text-right"
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {filter.dateRange?.to ? (
                          format(filter.dateRange.to, "yyyy/MM/dd", { locale: ar })
                        ) : (
                          <span>تاريخ النهاية</span>
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
          
          {activeTab === "manager" && (
            <Card className="border-amber-300 shadow-md">
              <CardHeader className="bg-amber-50">
                <CardTitle className="flex items-center text-amber-800">
                  <Lock className="ml-2 h-5 w-5" />
                  مستندات المدراء
                </CardTitle>
                <CardDescription className="text-amber-700">
                  هذا القسم مخصص للمستندات الإدارية السرية والحساسة
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  المستندات المرفوعة هنا ستكون مرئية فقط للمدراء والمشرفين. استخدم هذا القسم للمستندات الحساسة مثل:
                </p>
                <ul className="text-sm text-muted-foreground mr-6 mt-2 space-y-1 list-disc">
                  <li>عقود العمل</li>
                  <li>الميزانيات التفصيلية</li>
                  <li>تقارير الأداء</li>
                  <li>الخطط الاستراتيجية</li>
                  <li>المستندات المالية الداخلية</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
