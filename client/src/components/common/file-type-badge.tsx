// مكون شارة نوع الملف
import React from 'react';
import { cn } from '@/lib/utils';
import { getFileTypeLabel, getFileTypeBadgeClasses } from '@/utils/file-utils';
import { FileTypeIcon } from './file-type-icon';

interface FileTypeBadgeProps {
  fileType: string;
  showLabel?: boolean;
  className?: string;
}

export function FileTypeBadge({ fileType, showLabel = true, className }: FileTypeBadgeProps) {
  // الحصول على وصف النوع وصفوف التصميم المناسبة
  const typeLabel = getFileTypeLabel(fileType);
  const badgeClasses = getFileTypeBadgeClasses(fileType);
  
  return (
    <span 
      className={cn(
        'inline-flex items-center px-2 py-1 text-xs font-medium border rounded',
        badgeClasses,
        className
      )}
    >
      <FileTypeIcon fileType={fileType} className="h-3.5 w-3.5 ml-1" />
      {showLabel && typeLabel}
    </span>
  );
}