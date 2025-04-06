// مكون شارة نوع الملف
import { Badge } from '@/components/ui/badge';
import { getFileTypeIcon, getFileTypeLabel, getFileTypeBadgeClasses } from '@/utils/file-utils';

interface FileBadgeProps {
  fileType: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FileBadge({ fileType, size = 'md' }: FileBadgeProps) {
  // تحديد الفئات المناسبة لحجم الشارة
  const sizeClasses = {
    sm: 'text-[10px] py-0 px-1',
    md: 'text-xs py-0.5 px-1.5',
    lg: 'text-sm py-1 px-2'
  };

  return (
    <Badge 
      variant="outline" 
      className={`${getFileTypeBadgeClasses(fileType)} flex items-center ${sizeClasses[size]}`}
    >
      {getFileTypeIcon(fileType)}
      <span className="mr-1">{getFileTypeLabel(fileType)}</span>
    </Badge>
  );
}