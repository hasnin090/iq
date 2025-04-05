import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// تكوين Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

console.log('تم تهيئة Firebase Storage بنجاح');

/**
 * تحميل ملف إلى Firebase Storage
 * @param file الملف الذي سيتم تحميله (Buffer أو مسار)
 * @param destination مسار الوجهة في تخزين Firebase
 * @param contentType نوع محتوى الملف
 * @param metadata بيانات وصفية إضافية للملف
 * @returns وعد بعنوان URL الملف المحمل
 */
export const uploadFile = async (
  fileData: Buffer | string,
  destination: string,
  contentType?: string,
  metadata: Record<string, string> = {}
): Promise<string> => {
  try {
    // تحضير Buffer إذا كان المدخل مسار ملف
    let fileBuffer: Buffer;
    if (typeof fileData === 'string') {
      // التأكد من وجود الملف
      if (!fs.existsSync(fileData)) {
        throw new Error(`الملف غير موجود: ${fileData}`);
      }
      fileBuffer = fs.readFileSync(fileData);
    } else {
      fileBuffer = fileData;
    }
    
    // تحديد نوع المحتوى استناداً إلى امتداد الملف إذا لم يتم تحديده
    const extension = path.extname(destination).toLowerCase();
    const detectedContentType = contentType || getContentTypeFromExtension(extension);
    
    // إنشاء مرجع للملف في Firebase Storage
    const storageRef = ref(storage, destination);
    
    // رفع الملف إلى Firebase Storage
    const uploadResult = await uploadBytes(storageRef, fileBuffer, {
      contentType: detectedContentType,
      customMetadata: metadata
    });
    
    // الحصول على عنوان URL للتنزيل
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    console.log(`تم رفع الملف بنجاح إلى Firebase Storage: ${downloadURL}`);
    return downloadURL;
  } catch (error: any) {
    console.error('خطأ في تحميل الملف إلى Firebase Storage:', error);
    throw new Error(`فشل في تحميل الملف إلى Firebase Storage: ${error.message}`);
  }
};

/**
 * حذف ملف من Firebase Storage
 * @param fileUrl عنوان URL للملف المراد حذفه
 * @returns وعد يشير إلى اكتمال عملية الحذف
 */
export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  if (!fileUrl) {
    console.warn('تم استدعاء deleteFile بدون عنوان URL للملف');
    return false;
  }
  
  try {
    // التحقق مما إذا كان عنوان URL من Firebase Storage
    if (!fileUrl.includes('firebasestorage.googleapis.com')) {
      console.warn(`عنوان URL غير صالح لـ Firebase Storage: ${fileUrl}`);
      return false;
    }
    
    // استخراج المسار من عنوان URL
    try {
      // تحليل عنوان URL للحصول على المسار
      const urlObj = new URL(fileUrl);
      const pathFromUrl = urlObj.pathname.split('/o/')[1];
      
      if (!pathFromUrl) {
        console.warn(`لا يمكن استخراج المسار من عنوان URL: ${fileUrl}`);
        return false;
      }
      
      // فك ترميز URI للحصول على المسار الصحيح
      const decodedPath = decodeURIComponent(pathFromUrl);
      
      // إنشاء مرجع للملف في Firebase Storage
      const fileRef = ref(storage, decodedPath);
      
      // حذف الملف
      await deleteObject(fileRef);
      console.log(`تم حذف الملف بنجاح من Firebase Storage: ${decodedPath}`);
      return true;
    } catch (urlError: any) {
      console.error('خطأ في تحليل عنوان URL:', urlError);
      
      // محاولة أخرى: استخدام المسار مباشرة
      try {
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);
        console.log(`تم حذف الملف بنجاح باستخدام المسار المباشر: ${fileUrl}`);
        return true;
      } catch (directError: any) {
        console.error('خطأ في حذف الملف باستخدام المسار المباشر:', directError);
        return false;
      }
    }
  } catch (error: any) {
    console.error('خطأ في حذف الملف من Firebase Storage:', error);
    throw new Error(`فشل في حذف الملف من Firebase Storage: ${error.message}`);
  }
};

/**
 * تحديد نوع المحتوى بناءً على امتداد الملف
 */
function getContentTypeFromExtension(extension: string): string {
  const contentTypeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv'
  };
  
  return contentTypeMap[extension] || 'application/octet-stream';
}

/**
 * دالة مساعدة لفحص نوع الملف
 * @param fileType نوع الملف كسلسلة نصية
 * @returns نوع الملف بدون التفاصيل
 */
export const getFileType = (fileType: string): string => {
  // استخراج النوع الأساسي من سلسلة نوع الملف
  // مثال: 'image/jpeg' سترجع 'image'
  return fileType.split('/')[0] || 'unknown';
};

/**
 * دالة مساعدة لتحويل حجم الملف إلى تنسيق مقروء
 * @param sizeInBytes حجم الملف بالبايت
 * @returns حجم الملف بتنسيق مقروء (مثل KB, MB)
 */
export const getReadableFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} بايت`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${Math.round(sizeInBytes / 1024 * 10) / 10} كيلوبايت`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${Math.round(sizeInBytes / (1024 * 1024) * 10) / 10} ميجابايت`;
  } else {
    return `${Math.round(sizeInBytes / (1024 * 1024 * 1024) * 10) / 10} جيجابايت`;
  }
};