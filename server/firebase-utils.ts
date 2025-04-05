import * as admin from 'firebase-admin';
import fs from 'fs';
import * as path from 'path';

// تعريف متغير لتخزين مرجع firebase admin
let firebaseApp: admin.app.App;

// تهيئة Firebase Admin SDK باستخدام بيانات الاعتماد من المتغيرات البيئية
try {
  const firebaseConfig = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    apiKey: process.env.VITE_FIREBASE_API_KEY,
  };

  // التحقق من وجود المعلومات المطلوبة قبل التهيئة
  if (firebaseConfig.projectId && firebaseConfig.appId) {
    // نتحقق إذا كانت Firebase مهيأة مسبقًا لتجنب تهيئتها مرة أخرى
    try {
      firebaseApp = admin.app();
    } catch {
      // استخدام applicationDefault للحصول على بيانات الاعتماد
      // وهذا سيعمل في بيئة Replit ومعظم بيئات التطوير
      firebaseApp = admin.initializeApp({
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.projectId + '.appspot.com'
      });
      console.log('Firebase Admin SDK تمت تهيئة');
    }
  } else {
    console.warn('تحذير: Firebase Admin SDK لم يتم تهيئته بسبب نقص معلومات التكوين الأساسية');
  }
} catch (error) {
  console.error('خطأ أثناء تهيئة Firebase Admin SDK:', error);
}

/**
 * تحميل ملف إلى Firebase Storage
 * @param file الملف الذي سيتم تحميله (Buffer أو مسار)
 * @param destination مسار الوجهة في Firebase Storage
 * @returns وعد بعنوان URL الملف المحمل
 */
export const uploadFile = async (fileData: Buffer | string, destination: string): Promise<string> => {
  try {
    // التحقق من أن Firebase تم تهيئته بشكل صحيح
    if (!admin.storage) {
      throw new Error('Firebase Storage غير متاح. تأكد من تهيئة Firebase Admin SDK بشكل صحيح');
    }

    const bucket = admin.storage().bucket();
    
    // إذا كان fileData نصاً، فهو مسار للملف
    let buffer: Buffer;
    if (typeof fileData === 'string') {
      buffer = fs.readFileSync(fileData);
    } else {
      buffer = fileData;
    }

    // إنشاء كائن الملف في Storage
    const file = bucket.file(destination);
    
    // تحميل الملف مع مراقبة التقدم
    const startTime = Date.now();
    let uploadProgress = 0;

    return new Promise((resolve, reject) => {
      // تهيئة تدفق الكتابة
      const stream = file.createWriteStream({
        metadata: {
          contentType: 'application/octet-stream', // سيتم تحديده تلقائياً بناء على امتداد الملف
        },
        resumable: true,
      });

      // معالجة الأحداث المختلفة
      stream.on('error', (error) => {
        console.error('خطأ أثناء تحميل الملف:', error);
        reject(error);
      });

      stream.on('progress', (progressData) => {
        // التقدم كنسبة مئوية
        uploadProgress = Math.round((progressData.bytesWritten / buffer.length) * 100);
        console.log(`تقدم التحميل: ${uploadProgress}%`);
      });

      stream.on('finish', async () => {
        const endTime = Date.now();
        console.log(`تم الانتهاء من تحميل الملف في ${(endTime - startTime) / 1000} ثانية`);

        try {
          // جعل الملف عاماً للقراءة
          await file.makePublic();
          
          // الحصول على URL العام
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
          console.log('عنوان URL العام للملف:', publicUrl);
          resolve(publicUrl);
        } catch (error) {
          console.error('خطأ في إعداد الملف على أنه عام:', error);
          reject(error);
        }
      });

      // كتابة البيانات إلى التدفق
      stream.end(buffer);
    });
  } catch (error) {
    console.error('خطأ في تحميل الملف إلى Firebase Storage:', error);
    throw error;
  }
};

/**
 * حذف ملف من Firebase Storage
 * @param fileUrl عنوان URL للملف المراد حذفه
 * @returns وعد يشير إلى اكتمال عملية الحذف
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    if (!admin.storage) {
      throw new Error('Firebase Storage غير متاح. تأكد من تهيئة Firebase Admin SDK بشكل صحيح');
    }

    // استخراج المسار من URL
    const bucket = admin.storage().bucket();
    
    // يفترض أن URL يكون بالتنسيق https://storage.googleapis.com/BUCKET_NAME/FILE_PATH
    const urlParts = fileUrl.split('/');
    const filePath = urlParts.slice(4).join('/'); // تخطي https:, '', storage.googleapis.com, BUCKET_NAME
    
    if (!filePath) {
      throw new Error(`مسار الملف غير صالح من URL: ${fileUrl}`);
    }
    
    // حذف الملف
    console.log(`محاولة حذف الملف: ${filePath}`);
    await bucket.file(filePath).delete();
    console.log(`تم حذف الملف بنجاح: ${filePath}`);
  } catch (error) {
    console.error('خطأ في حذف الملف من Firebase Storage:', error);
    throw error;
  }
};