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
      "overflow-hidden border transition-all hover:shadow-md",
      isManagerSection && "border-amber-200/40 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/20"
    )}>
      <CardHeader className={cn(
        "p-2 xs:p-3 pb-0 flex justify-between items-start gap-1 xs:gap-2",
        isManagerSection && "bg-amber-50/60 dark:bg-amber-950/30"
      )}>
        <div className="space-y-1 overflow-hidden flex-1">
          <div className="flex items-start gap-1 xs:gap-2">
            <FileTypeIcon 
              fileType={document.fileType} 
              className={cn(
                "h-4 w-4 xs:h-5 xs:w-5 mt-0.5 flex-shrink-0",
                isManagerSection && "text-amber-600 dark:text-amber-500"
              )}
            />
            <div className="space-y-0.5 xs:space-y-1 overflow-hidden w-full">
              <h3 className={cn(
                "font-medium text-xs xs:text-sm line-clamp-1 break-all",
                isManagerSection && "text-amber-800 dark:text-amber-400"
              )}>
                {highlightText(document.name)}
              </h3>
              <div className="flex flex-wrap gap-1 text-[10px] xs:text-xs text-muted-foreground">
                <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-[200px]">
                  {project ? highlightText(project.name) : 'بدون مشروع'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 xs:h-8 xs:w-8 flex-shrink-0 -mt-1 -ml-1 mb-1">
              <MoreVertical className="h-3 w-3 xs:h-4 xs:w-4" />
              <span className="sr-only">فتح القائمة</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPreview(document)} className="flex items-center text-xs xs:text-sm">
              <Eye className="ml-1 xs:ml-2 h-3 w-3 xs:h-4 xs:w-4" />
              <span>معاينة</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)} className="flex items-center text-xs xs:text-sm">
              <Download className="ml-1 xs:ml-2 h-3 w-3 xs:h-4 xs:w-4" />
              <span>تنزيل</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive flex items-center text-xs xs:text-sm"
              onClick={() => onDelete(document)}
            >
              <Trash2 className="ml-1 xs:ml-2 h-3 w-3 xs:h-4 xs:w-4" />
              <span>حذف</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent 
        className="p-2 xs:p-3 pt-0 cursor-pointer" 
        onClick={() => onPreview(document)}
      >
        <div className={cn(
          "mt-2 aspect-video rounded-md overflow-hidden flex items-center justify-center relative",
          isManagerSection ? "bg-amber-50 dark:bg-amber-950/30" : "bg-muted"
        )}>
          {isImage ? (
            <img 
              src={document.fileUrl} 
              alt={document.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiIGNsYXNzPSJkYXJrOmZpbGwtZ3JheS04MDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNzc3IiBjbGFzcz0iZGFyazpmaWxsLWdyYXktMzAwIj5DYW5ub3QgbG9hZCBpbWFnZTwvdGV4dD48L3N2Zz4=';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-3 xs:py-4">
              <FileIcon className={cn(
                "h-8 w-8 xs:h-10 xs:w-10 mb-1 xs:mb-2",
                isManagerSection 
                  ? "text-amber-600/70 dark:text-amber-500/70" 
                  : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] xs:text-xs",
                isManagerSection 
                  ? "text-amber-700/70 dark:text-amber-400/70" 
                  : "text-muted-foreground"
              )}>
                {document.fileType.split('/').pop()?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-2 xs:p-3 pt-1 flex items-center justify-between">
        <span className="text-[10px] xs:text-xs text-muted-foreground flex-shrink-0" dir="ltr">
          {format(new Date(document.uploadDate), 'dd MMM yyyy', { locale: ar })}
        </span>
        <FileTypeBadge 
          fileType={document.fileType} 
          className="text-[9px] xs:text-[10px] py-0.5 px-1 xs:px-1.5 mr-0"
        />
      </CardFooter>
    </Card>
  );
}