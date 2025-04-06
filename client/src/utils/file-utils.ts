// مكتبة أدوات التعامل مع الملفات
// ملاحظة: هذا الملف لا يجب أن يحتوي على مكونات React
// لأنه ملف مساعد عام يجب أن يكون قابل لإعادة الاستخدام

/**
 * استخراج نوع الملف الرئيسي من نوع MIME
 * @param fileType نوع الملف MIME
 * @returns نوع الملف الرئيسي
 */
export const getMainFileType = (fileType: string): string => {
  if (!fileType) return 'other';
  
  fileType = fileType.toLowerCase();
  
  if (fileType.includes('image')) return 'image';
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.includes('word') || fileType.includes('document') || fileType.includes('msword') || fileType.includes('officedocument.word')) return 'word';
  if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('officedocument.spreadsheet')) return 'excel';
  if (fileType.includes('powerpoint') || fileType.includes('presentation') || fileType.includes('officedocument.presentation')) return 'powerpoint';
  if (fileType.includes('text') || fileType.includes('txt')) return 'text';
  
  return 'other';
};

/**
 * الحصول على وصف لنوع الملف
 * @param fileType نوع الملف
 * @returns وصف نوع الملف
 */
export const getFileTypeLabel = (fileType: string): string => {
  const type = getMainFileType(fileType);
  
  switch (type) {
    case 'image': return 'صورة';
    case 'pdf': return 'PDF';
    case 'word': return 'مستند Word';
    case 'excel': return 'جدول Excel';
    case 'powerpoint': return 'عرض تقديمي';
    case 'text': return 'ملف نصي';
    default: return 'ملف آخر';
  }
};

/**
 * الحصول على اسم أيقونة مناسبة لنوع الملف
 * @param fileType نوع الملف
 * @returns اسم الأيقونة
 */
export const getFileTypeIconName = (fileType: string): string => {
  const type = getMainFileType(fileType);
  
  switch (type) {
    case 'image': return 'FileImage';
    case 'pdf': return 'File';
    case 'word': return 'FileText';
    case 'excel': return 'FileSpreadsheet';
    case 'powerpoint': return 'Presentation';
    default: return 'FileIcon';
  }
};

/**
 * الحصول على صفوف التصميم المناسبة لنوع الملف
 * @param fileType نوع الملف
 * @returns سلسلة صفوف التصميم
 */
export const getFileTypeBadgeClasses = (fileType: string): string => {
  const type = getMainFileType(fileType);
  
  switch (type) {
    case 'image':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    case 'pdf':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    case 'word':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800';
    case 'excel':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    case 'powerpoint':
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
  }
};

/**
 * التحقق مما إذا كان الملف صورة
 * @param fileType نوع الملف
 * @returns حالة كون الملف صورة
 */
export const isImageFile = (fileType: string): boolean => {
  return getMainFileType(fileType) === 'image';
};

/**
 * التحقق مما إذا كان الملف PDF
 * @param fileType نوع الملف
 * @returns حالة كون الملف PDF
 */
export const isPdfFile = (fileType: string): boolean => {
  return getMainFileType(fileType) === 'pdf';
};

/**
 * تحويل حجم الملف إلى نص مقروء
 * @param sizeInBytes حجم الملف بالبايت
 * @returns حجم الملف بصيغة مقروءة
 */
export const getReadableFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} بايت`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} كيلوبايت`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  } else {
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} جيجابايت`;
  }
};