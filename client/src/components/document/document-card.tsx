// مكون بطاقة المستند
import React from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Download, Eye, MoreVertical, 
  Trash2, FileIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Document as DocumentType, Project } from '@/types';
import { cn } from '@/lib/utils';
import { FileTypeIcon } from '@/components/common/file-type-icon';
import { FileTypeBadge } from '@/components/common/file-type-badge';
import { getMainFileType, isImageFile } from '@/utils/file-utils';

interface DocumentCardProps {
  document: DocumentType;
  projects: Project[];
  onDelete: (document: DocumentType) => void;
  onPreview: (document: DocumentType) => void;
  onDownload: (document: DocumentType) => void;
  isManagerSection?: boolean;
  searchQuery?: string;
}

export function DocumentCard({
  document,
  projects,
  onDelete,
  onPreview,
  onDownload,
  isManagerSection = false,
  searchQuery = ''
}: DocumentCardProps) {
  // البحث عن اسم المشروع المرتبط بالمستند
  const project = projects.find(p => p.id === document.projectId);
  const fileType = getMainFileType(document.fileType);
  const isImage = isImageFile(document.fileType);
  
  // تسليط الضوء على نص البحث إذا وجد
  const highlightText = (text: string) => {
    if (!searchQuery || !text) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? 
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-black dark:text-white px-1 rounded">{part}</mark> : 
        part
    );
  };
  
  return (
    <Card className={cn(
      "overflow-hidden border border-primary/10 dark:border-primary/5 transition-all hover:shadow-lg transform hover:-translate-y-1 hover:scale-[1.01] group rounded-xl",
      isManagerSection 
        ? "bg-gradient-to-br from-amber-50/60 to-white dark:from-amber-950/30 dark:to-transparent" 
        : "bg-gradient-to-br from-primary/5 to-transparent"
    )}>
      <CardHeader className={cn(
        "p-2 xs:p-3 pb-0 flex justify-between items-start gap-1 xs:gap-2",
        isManagerSection 
          ? "bg-gradient-to-b from-amber-100/30 to-transparent dark:from-amber-900/20 dark:to-transparent" 
          : "bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/20 dark:to-transparent"
      )}>
        <div className="space-y-0.5 overflow-hidden flex-1">
          <div className="flex items-start gap-1.5 xs:gap-2">
            <div className={cn(
              "h-7 w-7 xs:h-9 xs:w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
              isManagerSection ? 
                "bg-gradient-to-br from-amber-500 to-amber-400 dark:from-amber-600 dark:to-amber-700" :
                "bg-gradient-to-br from-primary to-primary/80"
            )}>
              <FileTypeIcon 
                fileType={document.fileType} 
                className="h-3.5 w-3.5 xs:h-4.5 xs:w-4.5 sm:h-5 sm:w-5 text-white"
              />
            </div>
            <div className="space-y-0.5 overflow-hidden w-full">
              <h3 className={cn(
                "font-semibold text-xs xs:text-sm sm:text-base line-clamp-1 break-all transition-colors group-hover:text-primary",
                isManagerSection && "text-amber-800 dark:text-amber-400"
              )}>
                {highlightText(document.name)}
              </h3>
              <div className="flex flex-wrap gap-1 text-[10px] xs:text-xs text-muted-foreground">
                <span className="truncate max-w-[120px] xs:max-w-[170px] sm:max-w-full inline-flex items-center bg-gray-100/80 dark:bg-gray-800/60 rounded-full px-1.5 py-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ml-1 ${project ? 'bg-green-500 dark:bg-green-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                  {project ? highlightText(project.name) : 'بدون مشروع'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 xs:h-9 xs:w-9 flex-shrink-0 -mt-1 -ml-1 mb-1 rounded-full hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
            >
              <MoreVertical className="h-4 w-4 xs:h-5 xs:w-5 text-primary/70" />
              <span className="sr-only">فتح القائمة</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl border border-primary/10 shadow-lg">
            <DropdownMenuItem onClick={() => onPreview(document)} className="flex items-center text-xs sm:text-sm cursor-pointer rounded-lg py-2">
              <Eye className="ml-2 h-4 w-4 text-primary" />
              <span>معاينة</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)} className="flex items-center text-xs sm:text-sm cursor-pointer rounded-lg py-2">
              <Download className="ml-2 h-4 w-4 text-green-600" />
              <span>تنزيل</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive flex items-center text-xs sm:text-sm cursor-pointer rounded-lg py-2"
              onClick={() => onDelete(document)}
            >
              <Trash2 className="ml-2 h-4 w-4 text-red-600" />
              <span>حذف</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent 
        className="p-2 xs:p-3 pt-2 cursor-pointer overflow-hidden" 
        onClick={() => onPreview(document)}
      >
        <div className={cn(
          "aspect-video rounded-lg overflow-hidden flex items-center justify-center relative shadow-sm group-hover:shadow border border-primary/10 dark:border-primary/5",
          isManagerSection ? 
            "bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/30 dark:to-gray-900/80" : 
            "bg-gradient-to-br from-primary/5 to-white/80 dark:from-primary/20 dark:to-gray-900"
        )}>
          {isImage ? (
            <div className="w-full h-full overflow-hidden">
              <img 
                src={document.fileUrl} 
                alt={document.name}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiIGNsYXNzPSJkYXJrOmZpbGwtZ3JheS04MDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNzc3IiBjbGFzcz0iZGFyazpmaWxsLWdyYXktMzAwIj5DYW5ub3QgbG9hZCBpbWFnZTwvdGV4dD48L3N2Zz4=';
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-3 xs:py-4 transform group-hover:scale-105 transition-transform duration-500">
              <FileIcon className={cn(
                "h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 mb-1.5 xs:mb-2",
                isManagerSection 
                  ? "text-amber-500/80 dark:text-amber-500/70" 
                  : "text-primary/70 dark:text-primary/60"
              )} />
              <span className={cn(
                "text-[10px] xs:text-xs font-medium px-2 py-1 rounded-md shadow-sm",
                isManagerSection 
                  ? "bg-amber-100/90 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400/90" 
                  : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground/90"
              )}>
                {document.fileType.split('/').pop()?.toUpperCase()}
              </span>
            </div>
          )}
          
          {/* أزرار الإجراءات تظهر عند التحويم للشاشات الكبيرة فقط */}
          <div className="hidden sm:flex absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-1.5">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onPreview(document);
              }}
              className="h-7 w-7 rounded-md bg-white/90 dark:bg-gray-800/90 shadow-sm flex items-center justify-center hover:bg-white dark:hover:bg-gray-800"
            >
              <Eye className="h-3.5 w-3.5 text-primary" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDownload(document);
              }}
              className="h-7 w-7 rounded-md bg-white/90 dark:bg-gray-800/90 shadow-sm flex items-center justify-center hover:bg-white dark:hover:bg-gray-800"
            >
              <Download className="h-3.5 w-3.5 text-green-600" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(document);
              }}
              className="h-7 w-7 rounded-md bg-white/90 dark:bg-gray-800/90 shadow-sm flex items-center justify-center hover:bg-white dark:hover:bg-gray-800"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </button>
          </div>
          
          {/* أزرار الإجراءات للشاشات الصغيرة، دائما مرئية وأكبر حجما */}
          <div className="flex sm:hidden absolute bottom-1.5 left-1.5 right-1.5 justify-center gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onPreview(document);
              }}
              className="h-8 w-8 rounded-md bg-white/90 dark:bg-gray-800/90 shadow-sm flex items-center justify-center"
            >
              <Eye className="h-3.5 w-3.5 text-primary" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDownload(document);
              }}
              className="h-8 w-8 rounded-md bg-white/90 dark:bg-gray-800/90 shadow-sm flex items-center justify-center"
            >
              <Download className="h-3.5 w-3.5 text-green-600" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(document);
              }}
              className="h-8 w-8 rounded-md bg-white/90 dark:bg-gray-800/90 shadow-sm flex items-center justify-center"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </button>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-2 xs:p-3 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/30">
        <span className="text-[10px] xs:text-xs text-muted-foreground flex-shrink-0 flex items-center bg-gray-100/80 dark:bg-gray-800/60 rounded-full px-1.5 py-0.5" dir="ltr">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {format(new Date(document.uploadDate), 'dd MMM yyyy', { locale: ar })}
        </span>
        <FileTypeBadge 
          fileType={document.fileType} 
          className="text-[10px] xs:text-xs py-0.5 px-2 shadow-sm" 
        />
      </CardFooter>
    </Card>
  );
}