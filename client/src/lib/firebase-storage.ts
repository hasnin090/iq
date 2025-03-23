import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

/**
 * تحميل ملف إلى Firebase Storage
 * @param file الملف المراد تحميله
 * @param path المسار داخل التخزين (مثل "documents/{userId}")
 * @returns وعد بعنوان URL للملف المحمّل
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    // إنشاء اسم فريد للملف بناءً على الوقت الحالي واسم الملف الأصلي
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
    const fullPath = `${path}/${fileName}`;
    
    // إنشاء مرجع للملف في Firebase Storage
    const fileRef = ref(storage, fullPath);
    
    // تحميل الملف
    const snapshot = await uploadBytes(fileRef, file);
    
    // الحصول على رابط التنزيل
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("خطأ في تحميل الملف:", error);
    throw new Error("فشل في تحميل الملف. يرجى المحاولة مرة أخرى.");
  }
};

/**
 * حذف ملف من Firebase Storage
 * @param fileUrl عنوان URL للملف المراد حذفه
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    // استخراج المسار من الـ URL
    const fileRef = ref(storage, fileUrl);
    
    // حذف الملف
    await deleteObject(fileRef);
  } catch (error) {
    console.error("خطأ في حذف الملف:", error);
    throw new Error("فشل في حذف الملف. يرجى المحاولة مرة أخرى.");
  }
};

/**
 * الحصول على ملف التعريف الصحيح بناءً على نوع الملف
 * @param fileType نوع ملف MIME
 * @returns نوع ملف مبسط (pdf، image، document، other)
 */
export const getFileType = (fileType: string): string => {
  if (fileType.includes('pdf')) {
    return 'pdf';
  } else if (fileType.includes('image')) {
    return 'image';
  } else if (fileType.includes('word') || fileType.includes('document')) {
    return 'document';
  } else {
    return 'other';
  }
};

/**
 * الحصول على حجم الملف بصيغة مقروءة
 * @param sizeInBytes حجم الملف بالبايت
 * @returns حجم الملف بصيغة مقروءة (مثل "2.5 MB")
 */
export const getReadableFileSize = (sizeInBytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = sizeInBytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};