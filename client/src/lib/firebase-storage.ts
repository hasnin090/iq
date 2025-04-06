// مكتبة للتعامل مع تخزين Firebase
import { getMainFileType, getReadableFileSize as formatFileSize } from '@/utils/file-utils';

/**
 * حذف ملف من Firebase Storage
 * @param fileUrl عنوان URL للملف المراد حذفه
 * @returns وعد يشير إلى اكتمال عملية الحذف
 */
export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/firebase/delete?fileUrl=${encodeURIComponent(fileUrl)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('فشل في حذف الملف');
    }
    
    return true;
  } catch (error) {
    console.error('خطأ في حذف الملف:', error);
    throw error;
  }
};

/**
 * الحصول على نوع الملف من URL
 * @param fileUrl عنوان URL للملف
 * @returns نوع الملف
 */
export const getFileTypeFromUrl = (fileUrl: string): string => {
  if (!fileUrl) return '';
  
  const extension = fileUrl.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return 'image/' + extension;
    case 'pdf':
      return 'application/pdf';
    case 'doc':
    case 'docx':
      return 'application/msword';
    case 'xls':
    case 'xlsx':
      return 'application/vnd.ms-excel';
    case 'ppt':
    case 'pptx':
      return 'application/vnd.ms-powerpoint';
    case 'txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
};

/**
 * تنزيل ملف من عنوان URL
 * @param url عنوان URL للملف
 * @param filename اسم الملف للتنزيل
 */
export const downloadFromUrl = (url: string, filename: string): void => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// تصدير دوال مكتبة file-utils للتوافق مع الكود القديم
export const getFileType = getMainFileType;
export const getReadableFileSize = formatFileSize;