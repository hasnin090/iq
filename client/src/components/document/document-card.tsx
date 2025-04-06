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
        <mark key={i} className="bg-yellow-200 text-black px-1 rounded">{part}</mark> : 
        part
    );
  };
  
  return (
    <Card className={cn(
      "overflow-hidden border transition-all hover:shadow-md",
      isManagerSection && "border-primary/20 bg-primary/5"
    )}>
      <CardHeader className="p-3 pb-0 flex justify-between items-start">
        <div className="space-y-1.5 overflow-hidden">
          <div className="flex items-start gap-2">
            <FileTypeIcon 
              fileType={document.fileType} 
              className="h-5 w-5 mt-0.5 flex-shrink-0" 
            />
            <div className="space-y-1 overflow-hidden">
              <h3 className="font-medium text-sm line-clamp-1 break-all">
                {highlightText(document.name)}
              </h3>
              <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                <span className="truncate max-w-[150px]">
                  {project ? highlightText(project.name) : 'بدون مشروع'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">فتح القائمة</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPreview(document)}>
              <Eye className="ml-2 h-4 w-4" />
              <span>معاينة</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="ml-2 h-4 w-4" />
              <span>تنزيل</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(document)}
            >
              <Trash2 className="ml-2 h-4 w-4" />
              <span>حذف</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent 
        className="p-3 pt-0 cursor-pointer" 
        onClick={() => onPreview(document)}
      >
        <div className="mt-2 aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
          {isImage ? (
            <img 
              src={document.fileUrl} 
              alt={document.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DYW5ub3QgbG9hZCBpbWFnZTwvdGV4dD48L3N2Zz4=';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <FileIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">
                {document.fileType.split('/').pop()?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-3 pt-0 flex items-center justify-between">
        <span className="text-xs text-muted-foreground" dir="ltr">
          {format(new Date(document.uploadDate), 'dd MMM yyyy', { locale: ar })}
        </span>
        <FileTypeBadge 
          fileType={document.fileType} 
          className="text-[10px] py-0.5 px-1.5"
        />
      </CardFooter>
    </Card>
  );
}