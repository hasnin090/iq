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
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 xs:gap-4 sm:gap-5 lg:gap-6 pt-2 pb-4 w-full overflow-x-visible">
          {sortedDocuments.map((document) => (
            <div key={document.id} className="transform transition-all duration-200 hover:scale-[1.01] max-w-full">
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
          ))}
        </div>
      ) : (
        <div className="space-y-4 py-2 w-full">
          {sortedDocuments.map((document) => (
            <div 
              key={document.id} 
              className={`rounded-lg border p-3 xs:p-4 flex flex-col sm:flex-row justify-between items-center transition-all duration-200 hover:shadow-md overflow-hidden break-words ${
                isManagerSection 
                  ? "border-amber-200/40 dark:border-amber-800/40 bg-gradient-to-r from-amber-50/50 to-white dark:from-amber-950/30 dark:to-transparent" 
                  : "bg-gradient-to-r from-blue-50/30 to-white dark:from-blue-950/10 dark:to-transparent hover:border-blue-200/30 dark:hover:border-blue-800/30"
              }`}
            >
              <div className="flex items-center w-full sm:w-auto mb-3 sm:mb-0">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className={`h-9 w-9 xs:h-10 xs:w-10 flex-shrink-0 rounded-full flex items-center justify-center ${
                    isManagerSection 
                      ? "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 shadow-sm" 
                      : "bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 shadow-sm"
                  }`}>
                    <FileTypeIcon 
                      fileType={document.fileType} 
                      className={`h-4 w-4 xs:h-5 xs:w-5 ${
                        isManagerSection 
                          ? "text-amber-600 dark:text-amber-500" 
                          : "text-[hsl(var(--primary))] dark:text-[hsl(var(--primary))]"
                      }`}
                    />
                  </div>
                  <div className="overflow-hidden min-w-0 flex-1">
                    <h3 className="font-semibold text-sm md:text-base truncate w-full">
                      {document.name}
                    </h3>
                    <div className="flex flex-wrap items-center mt-1 xs:mt-1.5 gap-1 xs:gap-2">
                      <span className="inline-flex items-center text-[10px] xs:text-xs text-muted-foreground truncate max-w-full">
                        <span className={`inline-block w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full ml-1 xs:ml-1.5 ${
                          document.projectId ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}></span>
                        {projects.find(p => p.id === document.projectId)?.name || 'بدون مشروع'}
                      </span>
                      <span className="text-[10px] xs:text-xs text-muted-foreground flex items-center" dir="ltr">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 xs:h-3 xs:w-3 ml-0.5 xs:ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {format(new Date(document.uploadDate), 'dd MMM yyyy', { locale: ar })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full xs:w-auto justify-start xs:justify-end sm:self-center mt-1 sm:mt-0">
                <FileTypeBadge 
                  fileType={document.fileType} 
                  className="py-0.5 xs:py-1 px-2 xs:px-2.5 text-[10px] xs:text-xs font-medium" 
                />
                <div className="flex gap-1 xs:gap-2 ml-auto xs:ml-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePreviewClick(document)}
                    className="rounded-full h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-auto px-1.5 xs:px-2 sm:px-3 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    <Eye className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-blue-600 dark:text-blue-400 sm:ml-1" /> 
                    <span className="hidden sm:inline ml-1 text-blue-600 dark:text-blue-400 text-xs">معاينة</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadFile(document)}
                    className="rounded-full h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-auto px-1.5 xs:px-2 sm:px-3 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/30"
                  >
                    <Download className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-green-600 dark:text-green-400 sm:ml-1" /> 
                    <span className="hidden sm:inline ml-1 text-green-600 dark:text-green-400 text-xs">تنزيل</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-auto px-1.5 xs:px-2 sm:px-3 border-red-200 dark:border-red-800/60 hover:bg-red-50 dark:hover:bg-red-900/30" 
                    onClick={() => handleDeleteClick(document)}
                  >
                    <Trash2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-red-600 dark:text-red-400 sm:ml-1" /> 
                    <span className="hidden sm:inline ml-1 text-red-600 dark:text-red-400 text-xs">حذف</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] xs:w-[90vw] sm:w-auto p-4 sm:p-6 max-w-md">
          <AlertDialogHeader className="space-y-1 xs:space-y-2">
            <AlertDialogTitle className="text-base xs:text-lg">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-xs xs:text-sm">
              هل أنت متأكد من رغبتك في حذف المستند؟
              <div className="font-semibold text-sm mt-1 mb-1 text-foreground/90">"{documentToDelete?.name}"</div>
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col xs:flex-row gap-2 mt-4 xs:mt-2 sm:mt-0">
            <AlertDialogCancel className="h-8 xs:h-9 text-xs xs:text-sm mt-0">إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 xs:h-9 text-xs xs:text-sm mt-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
              </svg>
              حذف المستند
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