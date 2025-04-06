// مكون أيقونة نوع الملف
import React from 'react';
import { FileText, FileImage, File, FileIcon, Presentation } from 'lucide-react';
import { getMainFileType, getFileTypeIconName } from '@/utils/file-utils';

interface FileTypeIconProps {
  fileType: string;
  className?: string;
  size?: number;
}

export function FileTypeIcon({ fileType, className, size = 24 }: FileTypeIconProps) {
  const type = getMainFileType(fileType);
  const iconProps = {
    className: className || `h-${size} w-${size}`,
    size
  };
  
  switch (type) {
    case 'image':
      return <FileImage {...iconProps} />;
    case 'pdf':
      return <File {...iconProps} />;
    case 'word':
      return <FileText {...iconProps} />;
    case 'excel':
      return <FileIcon {...iconProps} />;
    case 'powerpoint':
      return <Presentation {...iconProps} />;
    default:
      return <FileIcon {...iconProps} />;
  }
}