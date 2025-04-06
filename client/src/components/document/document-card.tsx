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
      "overflow-hidden border transition-all hover:shadow-md transform hover:-translate-y-0.5 group",
      isManagerSection && "border-amber-200/40 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/20"
    )}>
      <CardHeader className={cn(
        "p-2 xs:p-3 pb-0 flex justify-between items-start gap-1 xs:gap-2",
        isManagerSection && "bg-gradient-to-l from-amber-50/80 to-amber-50/40 dark:from-amber-950/40 dark:to-amber-950/20"
      )}>
        <div className="space-y-1 overflow-hidden flex-1">
          <div className="flex items-start gap-1 xs:gap-2">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
              isManagerSection ? 
                "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 shadow-sm" :
                "bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 shadow-sm"
            )}>
              <FileTypeIcon 
                fileType={document.fileType} 
                className={cn(
                  "h-4 w-4 xs:h-4.5 xs:w-4.5",
                  isManagerSection ? 
                    "text-amber-600 dark:text-amber-500" : 
                    "text-[hsl(var(--primary))] dark:text-[hsl(var(--primary))]"
                )}
              />
            </div>
            <div className="space-y-0.5 xs:space-y-1 overflow-hidden w-full">
              <h3 className={cn(
                "font-semibold text-xs xs:text-sm line-clamp-1 break-all transition-colors group-hover:text-[hsl(var(--primary))]",
                isManagerSection && "text-amber-800 dark:text-amber-400"
              )}>
                {highlightText(document.name)}
              </h3>
              <div className="flex flex-wrap gap-1 text-[10px] xs:text-xs text-muted-foreground">
                <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-[200px] inline-flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full ml-1 ${project ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                  {project ? highlightText(project.name) : 'بدون مشروع'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 xs:h-8 xs:w-8 flex-shrink-0 -mt-1 -ml-1 mb-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <MoreVertical className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              <span className="sr-only">فتح القائمة</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
            <DropdownMenuItem onClick={() => onPreview(document)} className="flex items-center text-xs xs:text-sm cursor-pointer rounded-md">
              <Eye className="ml-1.5 xs:ml-2 h-3.5 w-3.5 xs:h-4 xs:w-4 text-blue-500 dark:text-blue-400" />
              <span>معاينة</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)} className="flex items-center text-xs xs:text-sm cursor-pointer rounded-md">
              <Download className="ml-1.5 xs:ml-2 h-3.5 w-3.5 xs:h-4 xs:w-4 text-green-500 dark:text-green-400" />
              <span>تنزيل</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive flex items-center text-xs xs:text-sm cursor-pointer rounded-md"
              onClick={() => onDelete(document)}
            >
              <Trash2 className="ml-1.5 xs:ml-2 h-3.5 w-3.5 xs:h-4 xs:w-4 text-red-500 dark:text-red-400" />
              <span>حذف</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent 
        className="p-2 xs:p-3 pt-0 cursor-pointer overflow-hidden" 
        onClick={() => onPreview(document)}
      >
        <div className={cn(
          "mt-2 aspect-video rounded-lg overflow-hidden flex items-center justify-center relative shadow-sm group-hover:shadow border dark:border-gray-700",
          isManagerSection ? 
            "bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-gray-900/80" : 
            "bg-gradient-to-br from-blue-50/50 to-white dark:from-gray-800 dark:to-gray-900"
        )}>
          {isImage ? (
            <div className="w-full h-full overflow-hidden">
              <img 
                src={document.fileUrl} 
                alt={document.name}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiIGNsYXNzPSJkYXJrOmZpbGwtZ3JheS04MDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNzc3IiBjbGFzcz0iZGFyazpmaWxsLWdyYXktMzAwIj5DYW5ub3QgbG9hZCBpbWFnZTwvdGV4dD48L3N2Zz4=';
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-3 xs:py-4 transform group-hover:scale-105 transition-transform">
              <FileIcon className={cn(
                "h-9 w-9 xs:h-12 xs:w-12 mb-1 xs:mb-2",
                isManagerSection 
                  ? "text-amber-500/80 dark:text-amber-500/70" 
                  : "text-[hsl(var(--primary))/70] dark:text-[hsl(var(--primary))/60]"
              )} />
              <span className={cn(
                "text-[10px] xs:text-xs font-medium px-2 py-1 rounded-md",
                isManagerSection 
                  ? "bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400/90" 
                  : "bg-blue-50/80 text-[hsl(var(--primary))] dark:bg-blue-900/30 dark:text-blue-300/90"
              )}>
                {document.fileType.split('/').pop()?.toUpperCase()}
              </span>
            </div>
          )}
          
          {/* نسخة صغيرة من أزرار الإجراءات تظهر عند التحويم */}
          <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onPreview(document);
              }}
              className="h-6 w-6 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-sm flex items-center justify-center hover:bg-white dark:hover:bg-gray-800"
            >
              <Eye className="h-3 w-3 text-[hsl(var(--primary))] dark:text-blue-400" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDownload(document);
              }}
              className="h-6 w-6 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-sm flex items-center justify-center hover:bg-white dark:hover:bg-gray-800"
            >
              <Download className="h-3 w-3 text-green-600 dark:text-green-400" />
            </button>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-2 xs:p-3 pt-1 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
        <span className="text-[10px] xs:text-xs text-muted-foreground flex-shrink-0 flex items-center" dir="ltr">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {format(new Date(document.uploadDate), 'dd MMM yyyy', { locale: ar })}
        </span>
        <FileTypeBadge 
          fileType={document.fileType} 
          className="text-[9px] xs:text-[10px] py-0.5 px-1.5 xs:px-2 mr-0 font-medium"
        />
      </CardFooter>
    </Card>
  );
}