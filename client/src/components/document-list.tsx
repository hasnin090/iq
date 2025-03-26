import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, FileImage, File, FileIcon, Download, Eye, 
  Trash2, Loader2, Info, ArrowUpDown, Clock, Tag, CheckCircle2, XCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteFile, getFileType, getReadableFileSize } from '@/lib/firebase-storage';
import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Document {
  id: number;
  name: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  uploadDate: string;
  projectId?: number;
  uploadedBy: number;
}

interface Project {
  id: number;
  name: string;
}

interface DocumentListProps {
  documents: Document[];
  projects: Project[];
  isLoading: boolean;
  onDocumentUpdated: () => void;
  isManagerSection?: boolean; // إضافة خاصية لتحديد ما إذا كان قسم المدراء
}

export function DocumentList({ documents, projects, isLoading, onDocumentUpdated, isManagerSection = false }: DocumentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  
  const deleteMutation = useMutation({
    mutationFn: async (document: Document) => {
      try {
        // أولا حذف الملف من Firebase Storage
        if (document.fileUrl) {
          try {
            await deleteFile(document.fileUrl);
          } catch (error) {
            console.error("فشل في حذف الملف من التخزين:", error);
            // نستمر في الحذف من قاعدة البيانات حتى لو فشل حذف الملف
          }
        }
        
        // ثم حذف السجل من قاعدة البيانات
        return apiRequest('DELETE', `/api/documents/${document.id}`, undefined);
      } finally {
        // تنظيف الحالة بعد الحذف
        setDocumentToDelete(null);
      }
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المستند بنجاح",
      });
      onDocumentUpdated();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حذف المستند",
      });
    },
  });
  
  const handleDeleteClick = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete);
    }
    setDeleteDialogOpen(false);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yyyy/MM/dd', { locale: ar });
  };
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yyyy/MM/dd HH:mm', { locale: ar });
  };
  
  const getProjectName = (projectId?: number) => {
    if (!projectId) return 'عام';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'غير معروف';
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <File className="h-12 w-12 text-destructive" />;
    } else if (fileType.includes('image')) {
      return <FileImage className="h-12 w-12 text-primary" />;
    } else if (fileType.includes('word')) {
      return <FileText className="h-12 w-12 text-primary-light" />;
    } else {
      return <FileIcon className="h-12 w-12 text-muted-foreground" />;
    }
  };
  
  const getFileTypeBadge = (fileType: string) => {
    const type = getFileType(fileType);
    
    let color = "";
    switch(type) {
      case 'pdf':
        color = "bg-destructive/10 text-destructive border-destructive/20";
        break;
      case 'image':
        color = "bg-primary/10 text-primary border-primary/20";
        break;
      case 'document':
        color = "bg-primary-light/10 text-primary-light border-primary-light/20";
        break;
      default:
        color = "bg-muted/10 text-muted-foreground border-muted/20";
    }
    
    return (
      <Badge variant="outline" className={`${color} capitalize`}>
        {type}
      </Badge>
    );
  };
  
  const downloadFile = (doc: Document) => {
    // فتح الملف في نافذة جديدة للتنزيل المباشر
    toast({
      title: "بدء التنزيل",
      description: `جاري تنزيل ${doc.name}`,
    });
    
    // إنشاء عنصر الرابط وإطلاق تنزيل الملف
    const a = window.document.createElement('a');
    a.href = doc.fileUrl;
    a.download = doc.name;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };
  
  const previewFile = (doc: Document) => {
    setCurrentDocument(doc);
    setPreviewDialogOpen(true);
  };
  
  const isImageFile = (fileType: string) => {
    return fileType.includes('image');
  };
  
  const isPdfFile = (fileType: string) => {
    return fileType.includes('pdf');
  };
  
  const sortDocuments = (docs: Document[]) => {
    return [...docs].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = getFileType(a.fileType).localeCompare(getFileType(b.fileType));
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 mx-auto animate-spin" />
        <p className="mt-4 text-muted-foreground">جاري تحميل المستندات...</p>
      </div>
    );
  }
  
  if (documents.length === 0) {
    return (
      <div className="bg-secondary-light rounded-xl shadow-card p-10 text-center">
        <FileIcon className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
        <p className="text-muted-foreground mt-4">لا توجد مستندات حتى الآن</p>
        <p className="text-sm text-muted-foreground mt-2">أضف مستند جديد باستخدام النموذج أعلاه</p>
      </div>
    );
  }
  
  const sortedDocuments = sortDocuments(documents);
  
  return (
    <>
      <div className="bg-secondary-light rounded-xl shadow-card p-4 mb-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Tabs defaultValue="grid" onValueChange={(value) => setViewType(value as 'grid' | 'list')}>
              <TabsList>
                <TabsTrigger value="grid">عرض شبكي</TabsTrigger>
                <TabsTrigger value="list">عرض قائمة</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground ml-2">ترتيب حسب:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSortBy('date'); toggleSortOrder(); }}
              className={sortBy === 'date' ? 'bg-primary/5' : ''}
            >
              <Clock className="h-4 w-4 ml-1" />
              التاريخ
              {sortBy === 'date' && (
                <ArrowUpDown className="h-3 w-3 mr-1" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSortBy('name'); toggleSortOrder(); }}
              className={sortBy === 'name' ? 'bg-primary/5' : ''}
            >
              <Tag className="h-4 w-4 ml-1" />
              الاسم
              {sortBy === 'name' && (
                <ArrowUpDown className="h-3 w-3 mr-1" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSortBy('type'); toggleSortOrder(); }}
              className={sortBy === 'type' ? 'bg-primary/5' : ''}
            >
              <FileIcon className="h-4 w-4 ml-1" />
              النوع
              {sortBy === 'type' && (
                <ArrowUpDown className="h-3 w-3 mr-1" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedDocuments.map((document) => (
            <Card key={document.id} className="bg-secondary-light overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-foreground line-clamp-1">{document.name}</h3>
                    <div className="flex items-center mt-1 gap-2">
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {getProjectName(document.projectId)}
                      </p>
                      {getFileTypeBadge(document.fileType)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Clock className="h-3 w-3 inline ml-1" />
                      {formatDate(document.uploadDate)}
                    </p>
                  </div>
                  <div className="mr-4">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="cursor-help">{getFileIcon(document.fileType)}</div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="flex justify-between space-y-1.5">
                          <div>
                            <h4 className="text-sm font-semibold">{document.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              نوع الملف: {document.fileType.split('/')[1].toUpperCase()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              تاريخ الرفع: {formatDateTime(document.uploadDate)}
                            </p>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
                
                {document.description && (
                  <p className="text-sm text-muted-foreground mt-2 mb-4 line-clamp-2">
                    {document.description}
                  </p>
                )}
                
                <div className="flex justify-between mt-4">
                  <div className="flex space-x-2 space-x-reverse">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => previewFile(document)}
                    >
                      <Eye className="h-4 w-4 ml-1" />
                      معاينة
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadFile(document)}
                    >
                      <Download className="h-4 w-4 ml-1" />
                      تنزيل
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    onClick={() => handleDeleteClick(document)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-secondary-light rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-light border-b">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider">
                    اسم المستند
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider">
                    النوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider">
                    المشروع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider">
                    تاريخ الرفع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedDocuments.map((document) => (
                  <tr key={document.id} className="hover:bg-secondary/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center">
                        <div className="ml-2 flex-shrink-0">
                          {getFileIcon(document.fileType)}
                        </div>
                        <div className="mr-2">
                          <p className="font-medium">{document.name}</p>
                          {document.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {document.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getFileTypeBadge(document.fileType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getProjectName(document.projectId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(document.uploadDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex justify-end space-x-2 space-x-reverse">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => previewFile(document)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadFile(document)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(document)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* حوار حذف المستند */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا المستند؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : null}
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* حوار معاينة المستند */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {currentDocument && getFileIcon(currentDocument.fileType)}
              <span className="mr-2">{currentDocument?.name}</span>
            </DialogTitle>
            <DialogDescription>
              {currentDocument?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 h-[60vh] overflow-auto bg-secondary/30 rounded-lg p-2">
            {currentDocument && (
              <>
                {isImageFile(currentDocument.fileType) ? (
                  <div className="flex items-center justify-center h-full">
                    <img 
                      src={currentDocument.fileUrl} 
                      alt={currentDocument.name} 
                      className="max-w-full max-h-full object-contain" 
                    />
                  </div>
                ) : isPdfFile(currentDocument.fileType) ? (
                  <iframe 
                    src={`${currentDocument.fileUrl}#toolbar=0&navpanes=0`} 
                    title={currentDocument.name}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    {getFileIcon(currentDocument.fileType)}
                    <p className="mt-4 text-muted-foreground">
                      لا يمكن معاينة هذا النوع من الملفات مباشرة.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => window.open(currentDocument.fileUrl, '_blank')}
                    >
                      <FileIcon className="h-4 w-4 ml-2" />
                      فتح في علامة تبويب جديدة
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <div className="flex justify-between w-full items-center">
              <div className="flex flex-col text-sm text-muted-foreground">
                <span>المشروع: {currentDocument && getProjectName(currentDocument.projectId)}</span>
                <span>تاريخ الرفع: {currentDocument && formatDateTime(currentDocument.uploadDate)}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => currentDocument && downloadFile(currentDocument)}
                >
                  <Download className="h-4 w-4 ml-2" />
                  تنزيل
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (currentDocument) {
                      setPreviewDialogOpen(false);
                      handleDeleteClick(currentDocument);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف المستند
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
