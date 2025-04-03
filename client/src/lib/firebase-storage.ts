import { ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTaskSnapshot } from "firebase/storage";
import { storage } from "./firebase";
import { FirebaseStorage } from "firebase/storage";
import { getStorage } from "firebase/storage";
import { initializeApp } from "firebase/app";

// التحقق من وجود مفاتيح Firebase في متغيرات البيئة
const checkFirebaseKeys = (): boolean => {
  // لقد أصبحت المفاتيح مدمجة مباشرة في الكود، لذا سنعيد دائماً true
  return true;
};

// التأكد من تهيئة Firebase Storage في حالة كان التخزين غير متاح
const getFirebaseStorage = (): FirebaseStorage => {
  if (storage) {
    return storage;
  }
  
  // إذا لم يكن التخزين متاحًا، نحاول استخدام التخزين من الملف firebase.ts
  try {
    // استيراد التخزين من ملف firebase.ts
    const { storage: importedStorage } = require('./firebase');
    if (importedStorage) {
      console.log("استخدام التخزين الموجود في firebase.ts");
      return importedStorage;
    }
    
    // إذا لم يكن التخزين متاحًا، نقوم بتهيئة تكوين جديد
    console.log("تهيئة Firebase Storage من جديد");
    
    const firebaseConfig = {
      apiKey: "AIzaSyBLJb_pYS00-9VMPE9nnH5WyTKv18UGlcA",
      authDomain: "grokapp-5e120.firebaseapp.com",
      projectId: "grokapp-5e120",
      storageBucket: "grokapp-5e120.appspot.com",
      messagingSenderId: "846888480997",
      appId: "1:846888480997:web:971ec7fa47b901e27b640c",
      measurementId: "G-GS4CWFRC9Q"
    };
    
    // استخدام getApps للتحقق من وجود تطبيق مهيأ بالفعل
    const { getApps } = require('firebase/app');
    
    let app;
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    return getStorage(app);
  } catch (error) {
    console.error("Firebase Storage initialization error:", error);
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
    console.log("بدء عملية رفع الملف:", file.name, "الحجم:", file.size);
    
    // التحقق من وجود مفاتيح Firebase
    if (!checkFirebaseKeys()) {
      console.error("مفاتيح Firebase غير متوفرة");
      throw new Error("تعذر رفع الملف: مفاتيح Firebase غير متوفرة. يرجى التواصل مع مدير النظام.");
    }
    
    // تحديث التقدم إلى 1% لإظهار بدء العملية
    if (progressCallback) {
      progressCallback(1);
      console.log("تم تحديث نسبة التقدم إلى 1%");
    }
    
    // تحقق من حجم الملف
    if (file.size > 20 * 1024 * 1024) {
      throw new Error("حجم الملف كبير جداً، يجب أن يكون أقل من 20 ميجابايت");
    }
    
    // الحصول على كائن التخزين
    const firebaseStorage = getFirebaseStorage();
    console.log("تم الحصول على Firebase Storage بنجاح");
    
    // إنشاء اسم فريد للملف بناءً على الوقت الحالي وتصفية الاسم من الأحرف الخاصة
    const timestamp = new Date().getTime();
    const safeFileName = file.name
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${safeFileName}`;
    const fullPath = `${path}/${fileName}`;
    console.log("مسار الملف الكامل:", fullPath);
    
    // إنشاء مرجع للملف في Firebase Storage
    const fileRef = ref(firebaseStorage, fullPath);
    console.log("تم إنشاء مرجع الملف بنجاح");
    
    // إنشاء مهمة تحميل قابلة للاستئناف
    const uploadTask = uploadBytesResumable(fileRef, file);
    console.log("تم بدء مهمة التحميل");
    
    // تحديث التقدم إلى 10% بعد بدء التحميل
    if (progressCallback) {
      progressCallback(10);
      console.log("تم تحديث نسبة التقدم إلى 10%");
    }
    
    // استخدام Promise لتتبع التحميل وإرجاع الرابط
    return new Promise<string>((resolve, reject) => {
      console.log("داخل وعد التحميل (Promise)");
      
      // إضافة مستمع لحدث تغيير الحالة لتتبع التقدم
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          // حساب نسبة التقدم
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          
          // معلومات إضافية عن الحالة للتصحيح
          const bytesTransferred = snapshot.bytesTransferred;
          const totalBytes = snapshot.totalBytes;
          
          // طباعة معلومات مفصلة في وحدة التحكم
          console.log(`تقدم رفع الملف: ${progress}% (${bytesTransferred}/${totalBytes} bytes)`);
          
          // استدعاء دالة رد الاستدعاء للتقدم إذا تم توفيرها
          if (progressCallback) {
            // تأكد من أن التقدم لا يقل عن 10% لتجنب ظهوره كأنه 0%
            const adjustedProgress = Math.max(progress, 10);
            console.log(`تحديث نسبة التقدم في واجهة المستخدم: ${adjustedProgress}%`);
            progressCallback(adjustedProgress);
          }
        },
        (error) => {
          // معالجة الأخطاء أثناء التحميل
          console.error("خطأ في تحميل الملف:", error);
          console.error("تفاصيل الخطأ:", JSON.stringify(error));
          
          // رسالة خطأ أكثر توضيحًا للمستخدم
          let errorMessage = "فشل في تحميل الملف";
          
          if (error.code === 'storage/unauthorized') {
            errorMessage = "غير مصرح لك برفع الملفات. تأكد من تسجيل الدخول وأن لديك الصلاحيات المناسبة.";
          } else if (error.code === 'storage/canceled') {
            errorMessage = "تم إلغاء عملية رفع الملف. حاول مرة أخرى.";
          } else if (error.code === 'storage/unknown') {
            errorMessage = "حدث خطأ غير معروف أثناء رفع الملف. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.";
          } else if (error.code === 'storage/quota-exceeded') {
            errorMessage = "تم تجاوز الحد الأقصى لمساحة التخزين. الرجاء التواصل مع مدير النظام.";
          } else if (error.code === 'storage/invalid-argument') {
            errorMessage = "هناك مشكلة في الملف الذي تحاول رفعه. تأكد من أن الملف صالح وحاول مرة أخرى.";
          } else if (error.message) {
            errorMessage = `فشل في تحميل الملف: ${error.message}`;
          }
          
          reject(new Error(errorMessage));
        },
        async () => {
          console.log("اكتمل التحميل بنجاح، جاري الحصول على رابط التنزيل...");
          // عند اكتمال التحميل بنجاح
          try {
            // تأكد من تحديث التقدم إلى 100%
            if (progressCallback) {
              progressCallback(100);
              console.log("تم تحديث نسبة التقدم إلى 100%");
            }
            
            // الحصول على رابط التنزيل
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("تم رفع الملف بنجاح، رابط التنزيل:", downloadURL);
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
    if (error instanceof Error) {
      throw error; // إعادة إلقاء الخطأ الأصلي إذا كان متاحاً
    }
    throw new Error("فشل في إعداد عملية تحميل الملف. يرجى المحاولة مرة أخرى.");
  }
};

/**
 * حذف ملف من Firebase Storage
 * @param fileUrl عنوان URL للملف المراد حذفه
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    console.log("بدء عملية حذف الملف:", fileUrl);
    
    // التحقق من تنسيق URL
    if (!fileUrl || !fileUrl.includes('firebase') || !fileUrl.includes('storage')) {
      console.error("تنسيق URL غير صالح:", fileUrl);
      throw new Error("تنسيق URL غير صالح للملف المراد حذفه");
    }
    
    // الحصول على كائن التخزين
    const firebaseStorage = getFirebaseStorage();
    console.log("تم الحصول على كائن Firebase Storage");
    
    // استخراج المسار النسبي من URL إذا كان URL كاملاً
    let filePath = fileUrl;
    
    // إذا كان URL كاملاً من firebase (يبدأ بـ https://firebasestorage.googleapis.com/)
    if (fileUrl.startsWith('https://')) {
      try {
        // استخراج المسار من URL
        const url = new URL(fileUrl);
        // نمط URL القديم: /v0/b/{bucket}/o/{encoded_path}?alt=media&token={token}
        // أو النمط الجديد: /b/{bucket}/o/{encoded_path}?alt=media&token={token}
        const pathRegex = /\/o\/([^?]+)/;
        const match = url.pathname.match(pathRegex);
        
        if (match && match[1]) {
          // فك ترميز المسار لأنه قد يكون مشفراً في URL
          filePath = decodeURIComponent(match[1]);
          console.log("تم استخراج المسار النسبي من URL:", filePath);
        } else {
          throw new Error("تعذر استخراج المسار من URL");
        }
      } catch (err) {
        console.error("خطأ في استخراج المسار من URL:", err);
        throw new Error("تعذر معالجة URL الملف. تنسيق غير متوقع.");
      }
    }
    
    console.log("استخدام المسار النهائي للحذف:", filePath);
    const fileRef = ref(firebaseStorage, filePath);
    
    // حذف الملف
    await deleteObject(fileRef);
    console.log("تم حذف الملف بنجاح");
  } catch (error) {
    console.error("خطأ في حذف الملف:", error);
    
    // رسائل خطأ أكثر تفصيلاً بناءً على نوع الخطأ
    let errorMessage = "فشل في حذف الملف. يرجى المحاولة مرة أخرى.";
    
    if (error instanceof Error) {
      if (error.message.includes('unauthorized') || error.message.includes('permission-denied')) {
        errorMessage = "ليس لديك الصلاحية لحذف هذا الملف. يرجى التواصل مع مدير النظام.";
      } else if (error.message.includes('not-found') || error.message.includes('object-not-found')) {
        errorMessage = "لم يتم العثور على الملف المطلوب حذفه. ربما تم حذفه بالفعل.";
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorMessage = "فشل في الاتصال بخدمة التخزين. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.";
      } else {
        errorMessage = `فشل في حذف الملف: ${error.message}`;
      }
    }
    
    throw new Error(errorMessage);
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