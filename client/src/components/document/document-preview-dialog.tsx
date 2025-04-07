// مكون معاينة المستند
import React, { useState } from 'react';
import { X, Download, ExternalLink, Maximize2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Document as DocumentType } from '@/types';
import { FileTypeIcon } from '@/components/common/file-type-icon';
import { getFileTypeLabel, isImageFile, isPdfFile } from '@/utils/file-utils';

interface DocumentPreviewDialogProps {
  document: DocumentType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreviewDialog({
  document,
  open,
  onOpenChange
}: DocumentPreviewDialogProps) {
  // استخدام مكون معاينة بسيط بدلاً من Lightbox لتجنب مشكلات التوافق
  
  if (!document) return null;
  
  const isImage = isImageFile(document.fileType);
  const isPdf = isPdfFile(document.fileType);
  const fileDescription = getFileTypeLabel(document.fileType);
  const filename = document.name;
  
  const handleDownload = () => {
    const a = window.document.createElement('a');
    a.href = document.fileUrl;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };
  
  const handleOpenExternal = () => {
    window.open(document.fileUrl, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90dvh] w-[95vw] xs:w-[90vw] sm:w-auto overflow-hidden flex flex-col p-3 xs:p-4 sm:p-6">
        <DialogHeader className="mb-1 xs:mb-2 sm:mb-3 space-y-1 xs:space-y-2">
          <DialogTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
            <FileTypeIcon fileType={document.fileType} className="h-4 w-4 xs:h-5 xs:w-5 flex-shrink-0" />
            <span className="truncate">{filename}</span>
          </DialogTitle>
          <DialogDescription className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1 text-xs xs:text-sm mt-1">
            <span>{fileDescription}</span>
            <span className="text-[10px] xs:text-xs opacity-70" dir="ltr">
              {new Date(document.uploadDate).toLocaleDateString('ar-EG')}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden bg-muted dark:bg-muted/50 rounded-md my-1 xs:my-2 min-h-[200px] xs:min-h-[250px] sm:min-h-[300px] flex items-center justify-center relative">
          {isImage ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={document.fileUrl} 
                alt={document.name}
                className="max-w-full max-h-[50vh] xs:max-h-[55vh] sm:max-h-[60vh] object-contain dark:drop-shadow-md"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 bg-background/80 dark:bg-background/40 backdrop-blur-sm"
                onClick={handleOpenExternal}
              >
                <Maximize2 className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          ) : isPdf ? (
            <iframe 
              src={`${document.fileUrl}#toolbar=0`} 
              className="w-full h-full min-h-[250px] xs:min-h-[300px] sm:min-h-[400px] border-none dark:opacity-90" 
              title={document.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 xs:p-5 sm:p-6 text-center">
              <FileTypeIcon fileType={document.fileType} className="h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 text-muted-foreground dark:text-muted-foreground/80 mb-3 xs:mb-4" />
              <p className="text-sm xs:text-base text-muted-foreground dark:text-muted-foreground/90 mb-1 xs:mb-2">لا يمكن معاينة هذا النوع من الملفات</p>
              <p className="text-xs xs:text-sm text-muted-foreground dark:text-muted-foreground/70">
                يمكنك تنزيل الملف لعرضه على جهازك
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between gap-1.5 xs:gap-2 flex-wrap pt-1.5 xs:pt-2 mt-1 xs:mt-2">
          <div className="flex items-center w-full xs:w-auto">
            <Button variant="secondary" size="sm" onClick={handleOpenExternal} className="h-8 xs:h-9 text-xs xs:text-sm w-full xs:w-auto">
              <ExternalLink className="h-3 w-3 xs:h-3.5 xs:w-3.5 ml-1 xs:ml-1.5" />
              <span>فتح في تبويب جديد</span>
            </Button>
          </div>
          <Button onClick={handleDownload} className="h-8 xs:h-9 text-xs xs:text-sm w-full xs:w-auto mt-1.5 xs:mt-0">
            <Download className="h-3 w-3 xs:h-3.5 xs:w-3.5 ml-1 xs:ml-1.5" />
            <span>تنزيل</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}