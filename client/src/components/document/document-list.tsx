// مكون قائمة المستندات
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Document as DocumentType, Project } from '@/types';
import { Search, Eye, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { deleteFile } from '@/lib/firebase-storage';
import { DocumentPreviewDialog } from './document-preview-dialog';
import { DocumentCard } from './document-card';
import { DocumentListToolbar } from './document-list-toolbar';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { getMainFileType } from '@/utils/file-utils';
import { FileTypeIcon } from '@/components/common/file-type-icon';
import { FileTypeBadge } from '@/components/common/file-type-badge';

interface DocumentListProps {
  documents: DocumentType[];
  projects: Project[];
  isLoading: boolean;
  onDocumentUpdated: () => void;
  isManagerSection?: boolean;
  searchQuery?: string;
}

export function DocumentList({ 
  documents, 
  projects, 
  isLoading, 
  onDocumentUpdated, 
  isManagerSection = false, 
  searchQuery = '' 
}: DocumentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentType | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<DocumentType | null>(null);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  
  const deleteMutation = useMutation({
    mutationFn: async (document: DocumentType) => {
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
  
  const handleDeleteClick = (document: DocumentType) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete);
    }
    setDeleteDialogOpen(false);
  };
  
  const handlePreviewClick = (document: DocumentType) => {
    setCurrentDocument(document);
    setPreviewDialogOpen(true);
  };
  
  const downloadFile = (doc: DocumentType) => {
    toast({
      title: "بدء التنزيل",
      description: `جاري تنزيل ${doc.name}`,
    });
    
    const a = window.document.createElement('a');
    a.href = doc.fileUrl;
    a.download = doc.name;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };
  
  const sortDocuments = (docs: DocumentType[]) => {
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
          comparison = getMainFileType(a.fileType).localeCompare(getMainFileType(b.fileType));
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  if (isLoading) {
    return <LoadingState message="جاري تحميل المستندات..." />;
  }
  
  if (documents.length === 0) {
    return <EmptyState type="documents" />;
  }
  
  const sortedDocuments = sortDocuments(documents);
  
  return (
    <>
      {searchQuery && (
        <div className="bg-primary/10 dark:bg-primary/20 rounded-xl p-3 mb-4 flex items-center">
          <Search className="h-5 w-5 text-primary dark:text-primary/90 ml-2" />
          <div>
            <p className="text-primary dark:text-primary-foreground font-medium">
              نتائج البحث عن "{searchQuery}"
            </p>
            <p className="text-xs text-muted-foreground dark:text-primary-foreground/70">
              تم العثور على {documents.length} {documents.length === 1 ? 'مستند' : 'مستندات'}
            </p>
          </div>
        </div>
      )}
      
      <DocumentListToolbar 
        viewType={viewType}
        onViewTypeChange={setViewType}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={setSortBy}
        onSortOrderToggle={toggleSortOrder}
      />
      
      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {sortedDocuments.map((document) => (
            <DocumentCard 
              key={document.id}
              document={document}
              projects={projects}
              searchQuery={searchQuery}
              onDelete={handleDeleteClick}
              onPreview={handlePreviewClick}
              onDownload={downloadFile}
              isManagerSection={isManagerSection}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDocuments.map((document) => (
            <div 
              key={document.id} 
              className={`rounded-lg border p-3 flex flex-col sm:flex-row justify-between items-center transition-colors ${
                isManagerSection 
                  ? "border-amber-200/40 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/20" 
                  : "bg-card dark:bg-card/80"
              }`}
            >
              <div className="flex items-center w-full sm:w-auto mb-2 sm:mb-0">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <FileTypeIcon 
                    fileType={document.fileType} 
                    className={`h-6 w-6 mx-2 ${isManagerSection ? "text-amber-600 dark:text-amber-500" : ""}`}
                  />
                  <div className="overflow-hidden">
                    <h3 className="font-medium text-sm md:text-base truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
                      {document.name}
                    </h3>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-[200px]">
                        {projects.find(p => p.id === document.projectId)?.name || 'بدون مشروع'}
                      </span>
                      <span className="text-xs text-muted-foreground mx-2">•</span>
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {format(new Date(document.uploadDate), 'dd MMM yyyy', { locale: ar })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <FileTypeBadge fileType={document.fileType} className="ml-2" />
                <div className="flex space-x-1 space-x-reverse">
                  <Button variant="outline" size="sm" onClick={() => handlePreviewClick(document)}>
                    <Eye className="h-4 w-4 ml-1" /> <span className="hidden sm:inline">معاينة</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadFile(document)}>
                    <Download className="h-4 w-4 ml-1" /> <span className="hidden sm:inline">تنزيل</span>
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteClick(document)}>
                    <Trash2 className="h-4 w-4 ml-1" /> <span className="hidden sm:inline">حذف</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف المستند "{documentToDelete?.name}"؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              نعم، حذف المستند
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <DocumentPreviewDialog 
        document={currentDocument} 
        open={previewDialogOpen} 
        onOpenChange={setPreviewDialogOpen} 
      />
    </>
  );
}