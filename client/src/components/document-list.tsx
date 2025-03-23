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
import { Card, CardContent } from '@/components/ui/card';
import { FileText, FileImage, File, FileIcon, Download, Eye, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteFile, getFileType } from '@/lib/firebase-storage';

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
}

export function DocumentList({ documents, projects, isLoading, onDocumentUpdated }: DocumentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  
  const deleteMutation = useMutation({
    mutationFn: async (document: Document) => {
      setDeleting(true);
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
        setDeleting(false);
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
  
  const downloadFile = (document: Document) => {
    // فتح الملف في نافذة جديدة للتنزيل المباشر
    toast({
      title: "بدء التنزيل",
      description: `جاري تنزيل ${document.name}`,
    });
    
    window.open(document.fileUrl, '_blank');
  };
  
  const viewFile = (document: Document) => {
    // فتح الملف للعرض في نافذة جديدة
    toast({
      title: "عرض المستند",
      description: `جاري عرض ${document.name}`,
    });
    
    window.open(document.fileUrl, '_blank');
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="spinner w-8 h-8 mx-auto"></div>
        <p className="mt-4 text-muted">جاري تحميل البيانات...</p>
      </div>
    );
  }
  
  if (documents.length === 0) {
    return (
      <div className="bg-secondary-light rounded-xl shadow-card p-10 text-center">
        <p className="text-muted-foreground">لا توجد مستندات حتى الآن</p>
        <p className="text-sm text-muted mt-2">أضف مستند جديد باستخدام النموذج أعلاه</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((document) => (
          <Card key={document.id} className="bg-secondary-light overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-foreground line-clamp-1">{document.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    المشروع: {getProjectName(document.projectId)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    تاريخ الرفع: {formatDate(document.uploadDate)}
                  </p>
                </div>
                <div className="mr-4">{getFileIcon(document.fileType)}</div>
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
                    onClick={() => viewFile(document)}
                  >
                    <Eye className="h-4 w-4 ml-1" />
                    عرض
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
    </>
  );
}
