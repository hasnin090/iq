// مكون أيقونة الملف
import { getLargeFileTypeIcon } from '@/utils/file-utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { formatDateTime } from '@/utils/date-utils';

interface FileIconProps {
  document: {
    name: string;
    fileType: string;
    uploadDate: string;
    fileSize?: number;
  };
  size?: 'sm' | 'md' | 'lg';
  showInfo?: boolean;
}

export function FileIcon({ document, size = 'md', showInfo = true }: FileIconProps) {
  // تحديد الفئات المناسبة لحجم الأيقونة
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };
  
  const Icon = () => {
    const iconElement = getLargeFileTypeIcon(document.fileType);
    return (
      <div className={sizeClasses[size]}>
        {iconElement}
      </div>
    );
  };
  
  if (!showInfo) {
    return <Icon />;
  }
  
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="cursor-help">
          <Icon />
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 backdrop-blur-sm bg-white/80 dark:bg-zinc-900/90 dark:border-zinc-800 shadow-lg">
        <div className="flex justify-between space-y-1.5">
          <div>
            <h4 className="text-sm font-semibold">{document.name}</h4>
            <p className="text-sm text-muted-foreground">
              نوع الملف: {document.fileType.split('/')[1]?.toUpperCase() || 'غير معروف'}
            </p>
            <p className="text-sm text-muted-foreground">
              تاريخ الرفع: {formatDateTime(document.uploadDate)}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}