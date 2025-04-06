// مكون قائمة المستندات
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Document as DocumentType, Project } from '@/types';
import { Search } from 'lucide-react';
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
        <div className="bg-primary-light/20 rounded-xl p-3 mb-4 flex items-center">
          <Search className="h-5 w-5 text-primary ml-2" />
          <div>
            <p className="text-primary font-medium">
              نتائج البحث عن "{searchQuery}"
            </p>
            <p className="text-xs text-muted-foreground">
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
        <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-5 lg:gap-6">
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
        <div className="space-y-2">
          {sortedDocuments.map((document) => (
            <div 
              key={document.id} 
              className="bg-card rounded-lg border p-3 flex justify-between items-center"
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <DocumentCard 
                  document={document}
                  projects={projects}
                  searchQuery={searchQuery}
                  onDelete={handleDeleteClick}
                  onPreview={handlePreviewClick}
                  onDownload={downloadFile}
                  isManagerSection={isManagerSection}
                />
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