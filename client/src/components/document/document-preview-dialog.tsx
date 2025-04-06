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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileTypeIcon fileType={document.fileType} className="h-5 w-5" />
            <span className="truncate">{filename}</span>
          </DialogTitle>
          <DialogDescription className="flex justify-between items-center">
            <span>{fileDescription}</span>
            <span className="text-xs opacity-70" dir="ltr">
              {new Date(document.uploadDate).toLocaleDateString('ar-EG')}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden bg-muted dark:bg-muted/50 rounded-md my-2 min-h-[300px] flex items-center justify-center relative">
          {isImage ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={document.fileUrl} 
                alt={document.name}
                className="max-w-full max-h-[60vh] object-contain dark:drop-shadow-md"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 bg-background/80 dark:bg-background/40 backdrop-blur-sm"
                onClick={handleOpenExternal}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          ) : isPdf ? (
            <iframe 
              src={`${document.fileUrl}#toolbar=0`} 
              className="w-full h-full min-h-[400px] border-none dark:opacity-90" 
              title={document.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <FileTypeIcon fileType={document.fileType} className="h-16 w-16 text-muted-foreground dark:text-muted-foreground/80 mb-4" />
              <p className="text-muted-foreground dark:text-muted-foreground/90 mb-2">لا يمكن معاينة هذا النوع من الملفات</p>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground/70">
                يمكنك تنزيل الملف لعرضه على جهازك
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between gap-2 flex-wrap pt-2">
          <div className="flex items-center">
            <Button variant="secondary" size="sm" onClick={handleOpenExternal} className="h-9">
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              <span className="text-sm">فتح في تبويب جديد</span>
            </Button>
          </div>
          <Button onClick={handleDownload} className="h-9">
            <Download className="h-3.5 w-3.5 ml-1.5" />
            <span className="text-sm">تنزيل</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}