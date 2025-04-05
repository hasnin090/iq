import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// تهيئة Firebase Admin للخادم إذا كانت متغيرات البيئة متاحة
let firebaseAdmin;
try {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  
  if (projectId) {
    firebaseAdmin = initializeApp({
      projectId: projectId,
      storageBucket: `${projectId}.appspot.com`
    });
    console.log('Firebase Admin initialized successfully');
  } else {
    console.warn('Firebase project ID not found in environment variables');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

/**
 * تحميل ملف إلى Firebase Storage
 * @param file الملف الذي سيتم تحميله (Buffer أو مسار)
 * @param destination مسار الوجهة في Firebase Storage
 * @returns وعد بعنوان URL الملف المحمل
 */
export const uploadFile = async (fileData: Buffer | string, destination: string): Promise<string> => {
  try {
    if (!firebaseAdmin) {
      throw new Error('Firebase Admin not initialized');
    }
    
    // الحصول على خدمة التخزين
    const storage = getStorage(firebaseAdmin);
    const bucket = storage.bucket();
    
    // تحديد مسار الملف المؤقت إذا كان fileData هو Buffer
    let tempFilePath: string | null = null;
    let filePath = fileData as string;
    
    if (Buffer.isBuffer(fileData)) {
      // إنشاء ملف مؤقت لتخزين البيانات
      tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}`);
      await fs.promises.writeFile(tempFilePath, fileData);
      filePath = tempFilePath;
    }
    
    // تحميل الملف إلى Firebase Storage
    const uploadResponse = await bucket.upload(filePath, {
      destination: destination,
      metadata: {
        contentType: 'application/octet-stream', // يمكن تغييره حسب نوع الملف
      },
    });
    
    // الحصول على عنوان URL للملف المحمل
    const [file] = uploadResponse;
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '01-01-2100', // تاريخ انتهاء بعيد
    });
    
    // إزالة الملف المؤقت إذا تم إنشاؤه
    if (tempFilePath) {
      await fs.promises.unlink(tempFilePath);
    }
    
    return url;
  } catch (error) {
    console.error('Error uploading file to Firebase Storage:', error);
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
    if (!firebaseAdmin) {
      throw new Error('Firebase Admin not initialized');
    }
    
    const storage = getStorage(firebaseAdmin);
    const bucket = storage.bucket();
    
    // استخراج اسم الملف من URL
    const fileName = path.basename(fileUrl);
    
    // حذف الملف
    await bucket.file(fileName).delete();
  } catch (error) {
    console.error('Error deleting file from Firebase Storage:', error);
    throw error;
  }
};