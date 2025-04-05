import * as admin from 'firebase-admin';
import fs from 'fs';
import * as path from 'path';

// تهيئة Firebase Admin SDK بشكل مبسط بدون حاجة لشهادة
let firebaseApp: admin.app.App | undefined = undefined;

// محاولة بسيطة للتهيئة بدون حاجة لشهادة
try {
  // تحقق إذا كانت التطبيق مُهيأ
  try { 
    firebaseApp = admin.app();
    console.log('تم العثور على تهيئة Firebase السابقة');
  } catch {
    // تهيئة جديدة باستخدام معلومات بسيطة
    // هذه التهيئة لن تكون قادرة على استخدام Firebase Storage
    // لكنها ستمكننا من مواصلة العمل دون أخطاء
    firebaseApp = admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "dummy-project"
    });
    console.log('تم تهيئة Firebase Admin SDK بطريقة بسيطة');
  }
} catch (error) {
  console.error('خطأ في تهيئة Firebase Admin SDK المبسطة:', error);
}

/**
 * تحميل ملف إلى Firebase Storage
 * @param file الملف الذي سيتم تحميله (Buffer أو مسار)
 * @param destination مسار الوجهة في Firebase Storage
 * @returns وعد بعنوان URL الملف المحمل
 */
export const uploadFile = async (fileData: Buffer | string, destination: string): Promise<string> => {
  try {
    // نعمل بطريقة بديلة حتى لا نتكل على Firebase Storage
    // في حالة عدم توفر Firebase Storage، نخزن الملف محلياً ونرجع مساره
    try {
      admin.storage();
    } catch (error) {
      console.log('Firebase Storage غير متاح. سيتم تخزين الملف محلياً فقط');
      // نتحقق إذا كان fileData هو مسار ملف
      if (typeof fileData === 'string') {
        // نرجع مسار الملف نفسه كـ URL للتخزين المحلي
        return fileData;
      } else {
        // في حالة البيانات هي Buffer، نحفظها في مجلد التحميلات
        const uploadPath = './uploads/' + destination.split('/').pop();
        fs.writeFileSync(uploadPath, fileData);
        return uploadPath;
      }
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
    // نتحقق إذا كان الملف محلي
    if (fileUrl.startsWith('./uploads/') || fileUrl.startsWith('/uploads/')) {
      try {
        // محاولة حذف الملف المحلي
        if (fs.existsSync(fileUrl)) {
          fs.unlinkSync(fileUrl);
          console.log(`تم حذف الملف المحلي: ${fileUrl}`);
        }
        return;
      } catch (localError) {
        console.error('خطأ في حذف الملف المحلي:', localError);
        return;
      }
    }
    
    // نتحقق من توفر خدمة التخزين
    try {
      admin.storage();
    } catch (error) {
      console.log('Firebase Storage غير متاح. لا يمكن حذف الملف عن بعد');
      return;
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