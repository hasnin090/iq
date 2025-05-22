import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { 
  Archive as ArchiveIcon, 
  FileText, 
  Search, 
  Filter,
  Calendar,
  Download,
  Eye,
  Trash2,
  Plus,
  FolderOpen,
  Clock,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ArchivedDocument {
  id: number;
  name: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  uploadDate: string;
  archivedDate: string;
  archivedBy: number;
  projectId?: number;
  originalCategory: string;
  archiveReason?: string;
}

interface Project {
  id: number;
  name: string;
}

export default function Archive() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  // جلب المستندات المؤرشفة (حالياً سنعرض بيانات تجريبية)
  const { data: archivedDocuments = [], isLoading: documentsLoading } = useQuery<ArchivedDocument[]>({
    queryKey: ['/api/archive'],
    enabled: !!user,
  });

  // جلب المشاريع
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  // فلترة المستندات المؤرشفة
  const filteredDocuments = archivedDocuments.filter((doc: ArchivedDocument) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.archiveReason?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProject = selectedProject === 'all' || doc.projectId?.toString() === selectedProject;
    const matchesCategory = selectedCategory === 'all' || doc.originalCategory === selectedCategory;
    
    return matchesSearch && matchesProject && matchesCategory;
  });

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel')) return '📊';
    return '📁';
  };

  const getProjectName = (projectId?: number) => {
    const project = projects.find((p: Project) => p.id === projectId);
    return project?.name || 'بدون مشروع';
  };

  if (documentsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل الأرشيف...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="h-12 w-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
            <ArchiveIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">الأرشيف</h1>
            <p className="text-sm text-muted-foreground">إدارة المستندات المؤرشفة والملفات القديمة</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">
            {filteredDocuments.length} مستند مؤرشف
          </Badge>
        </div>
      </div>

      {/* أدوات البحث والفلترة */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            البحث والفلترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search" className="text-xs mb-1 block">البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="اسم المستند أو السبب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="project" className="text-xs mb-1 block">المشروع</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="اختر مشروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المشاريع</SelectItem>
                  {projects.map((project: Project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category" className="text-xs mb-1 block">الفئة الأصلية</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="اختر فئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الفئات</SelectItem>
                  <SelectItem value="documents">مستندات</SelectItem>
                  <SelectItem value="reports">تقارير</SelectItem>
                  <SelectItem value="contracts">عقود</SelectItem>
                  <SelectItem value="invoices">فواتير</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedProject('all');
                  setSelectedCategory('all');
                }}
                className="w-full"
              >
                إعادة تعيين
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* عرض النتائج */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">لا توجد مستندات مؤرشفة</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || selectedProject !== 'all' || selectedCategory !== 'all'
                  ? 'لا توجد مستندات مطابقة لمعايير البحث الحالية'
                  : 'لم يتم أرشفة أي مستندات بعد'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* شريط أدوات العرض */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant={viewType === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('grid')}
                className="h-8"
              >
                <div className="grid grid-cols-2 gap-0.5 h-3 w-3 mr-1">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
                شبكة
              </Button>
              <Button
                variant={viewType === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('list')}
                className="h-8"
              >
                <div className="space-y-0.5 mr-1">
                  <div className="h-0.5 w-3 bg-current"></div>
                  <div className="h-0.5 w-3 bg-current"></div>
                  <div className="h-0.5 w-3 bg-current"></div>
                </div>
                قائمة
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              عرض {filteredDocuments.length} من {archivedDocuments.length} مستند
            </p>
          </div>

          {/* عرض المستندات */}
          {viewType === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((doc: ArchivedDocument) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="text-2xl">{getFileTypeIcon(doc.fileType)}</span>
                        <div className="overflow-hidden">
                          <h3 className="font-semibold text-sm truncate">{doc.name}</h3>
                          <p className="text-xs text-muted-foreground">{getProjectName(doc.projectId)}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 pb-3">
                    <div className="space-y-2">
                      {doc.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{doc.description}</p>
                      )}
                      
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        أُرشف في {format(new Date(doc.archivedDate), 'dd MMM yyyy', { locale: enUS })}
                      </div>
                      
                      {doc.archiveReason && (
                        <div className="bg-slate-50 dark:bg-slate-800 rounded p-2">
                          <p className="text-xs text-muted-foreground">
                            <strong>سبب الأرشفة:</strong> {doc.archiveReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0">
                    <div className="flex gap-1 w-full">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        عرض
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        تحميل
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-right">
                        <th className="p-4 text-sm font-medium">المستند</th>
                        <th className="p-4 text-sm font-medium">المشروع</th>
                        <th className="p-4 text-sm font-medium">تاريخ الأرشفة</th>
                        <th className="p-4 text-sm font-medium">سبب الأرشفة</th>
                        <th className="p-4 text-sm font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.map((doc: ArchivedDocument) => (
                        <tr key={doc.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <span className="text-lg">{getFileTypeIcon(doc.fileType)}</span>
                              <div>
                                <p className="font-medium text-sm">{doc.name}</p>
                                {doc.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">{doc.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm">{getProjectName(doc.projectId)}</td>
                          <td className="p-4 text-sm">{format(new Date(doc.archivedDate), 'dd MMM yyyy', { locale: enUS })}</td>
                          <td className="p-4 text-sm">{doc.archiveReason || 'غير محدد'}</td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}