import { ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTaskSnapshot } from "firebase/storage";
import { storage } from "./firebase";
import { FirebaseStorage } from "firebase/storage";
import { getStorage } from "firebase/storage";
import { initializeApp } from "firebase/app";

// التأكد من تهيئة Firebase Storage في حالة كان التخزين غير متاح
const getFirebaseStorage = (): FirebaseStorage => {
  if (storage) {
    return storage;
  }
  
  // إذا لم يكن التخزين متاحًا، نقوم بتهيئته
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    
    const app = initializeApp(firebaseConfig);
    return getStorage(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw new Error("فشل في تهيئة Firebase Storage");
  }
};

/**
 * تحميل ملف إلى Firebase Storage مع دعم التقدم والاستئناف
 * @param file الملف المراد تحميله
 * @param path المسار داخل التخزين (مثل "documents/{userId}")
 * @param progressCallback دالة تُستدعى مع نسبة التقدم أثناء التحميل
 * @returns وعد بعنوان URL للملف المحمّل
 */
export const uploadFile = async (
  file: File,
  path: string,
  progressCallback?: (progress: number) => void
): Promise<string> => {
  try {
    // الحصول على كائن التخزين
    const firebaseStorage = getFirebaseStorage();
    
    // إنشاء اسم فريد للملف بناءً على الوقت الحالي وتصفية الاسم من الأحرف الخاصة
    const timestamp = new Date().getTime();
    const safeFileName = file.name
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${safeFileName}`;
    const fullPath = `${path}/${fileName}`;
    
    // إنشاء مرجع للملف في Firebase Storage
    const fileRef = ref(firebaseStorage, fullPath);
    
    // إنشاء مهمة تحميل قابلة للاستئناف
    const uploadTask = uploadBytesResumable(fileRef, file);
    
    // استخدام Promise لتتبع التحميل وإرجاع الرابط
    return new Promise<string>((resolve, reject) => {
      // إضافة مستمع لحدث تغيير الحالة لتتبع التقدم
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          // حساب نسبة التقدم
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          
          // استدعاء دالة رد الاستدعاء للتقدم إذا تم توفيرها
          if (progressCallback) {
            progressCallback(progress);
          }
        },
        (error) => {
          // معالجة الأخطاء أثناء التحميل
          console.error("خطأ في تحميل الملف:", error);
          reject(new Error("فشل في تحميل الملف. يرجى المحاولة مرة أخرى."));
        },
        async () => {
          // عند اكتمال التحميل بنجاح
          try {
            // الحصول على رابط التنزيل
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            console.error("خطأ في الحصول على رابط التنزيل:", error);
            reject(new Error("فشل في إكمال عملية التحميل. يرجى المحاولة مرة أخرى."));
          }
        }
      );
    });
  } catch (error) {
    console.error("خطأ في إعداد تحميل الملف:", error);
    throw new Error("فشل في إعداد عملية تحميل الملف. يرجى المحاولة مرة أخرى.");
  }
};

/**
 * حذف ملف من Firebase Storage
 * @param fileUrl عنوان URL للملف المراد حذفه
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    // الحصول على كائن التخزين
    const firebaseStorage = getFirebaseStorage();
    
    // الحصول على مرجع من URL
    // ملاحظة: هذا يعمل فقط مع URLs من Firebase Storage
    // إذا تم تخزين URL مباشرة من getDownloadURL()
    const httpsReference = ref(firebaseStorage, fileUrl);
    
    // حذف الملف
    await deleteObject(httpsReference);
  } catch (error) {
    console.error("خطأ في حذف الملف:", error);
    // نلقي خطأ أكثر تفصيلاً
    if (error instanceof Error) {
      throw new Error(`فشل في حذف الملف: ${error.message}`);
    } else {
      throw new Error("فشل في حذف الملف. يرجى المحاولة مرة أخرى.");
    }
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