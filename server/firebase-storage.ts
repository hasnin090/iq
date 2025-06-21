import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

let firebaseApp: any = null;
let firebaseStorage: any = null;
let isFirebaseInitialized = false;

// تهيئة Firebase Admin
export async function initializeFirebase(): Promise<boolean> {
  try {
    // التحقق من وجود متغيرات البيئة المطلوبة
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!serviceAccountKey || !storageBucket) {
      console.warn('متغيرات بيئة Firebase غير مكتملة');
      return false;
    }

    // تجنب إعادة التهيئة
    if (getApps().length > 0) {
      firebaseApp = getApps()[0];
    } else {
      // تحليل مفتاح الخدمة
      const serviceAccount = JSON.parse(serviceAccountKey);
      
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: storageBucket
      });
    }

    firebaseStorage = getStorage(firebaseApp);
    isFirebaseInitialized = true;
    console.log('✅ تم تكوين Firebase بنجاح');
    return true;
  } catch (error) {
    console.error('❌ فشل في تكوين Firebase:', error);
    isFirebaseInitialized = false;
    return false;
  }
}

// رفع ملف إلى Firebase Storage
export async function uploadToFirebase(
  file: Buffer | string,
  fileName: string,
  contentType?: string
): Promise<string | null> {
  if (!isFirebaseInitialized || !firebaseStorage) {
    throw new Error('Firebase غير متاح');
  }

  try {
    let fileBuffer: Buffer;
    
    if (typeof file === 'string') {
      const fs = require('fs');
      fileBuffer = fs.readFileSync(file);
    } else {
      fileBuffer = file;
    }

    const bucket = firebaseStorage.bucket();
    const fileRef = bucket.file(fileName);

    // رفع الملف
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: contentType || 'application/octet-stream',
      },
    });

    // جعل الملف عاماً للقراءة
    await fileRef.makePublic();

    // الحصول على رابط الملف العام
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    return publicUrl;
  } catch (error) {
    console.error('خطأ في رفع الملف إلى Firebase:', error);
    return null;
  }
}

// حذف ملف من Firebase Storage
export async function deleteFromFirebase(fileName: string): Promise<boolean> {
  if (!isFirebaseInitialized || !firebaseStorage) {
    return false;
  }

  try {
    const bucket = firebaseStorage.bucket();
    const fileRef = bucket.file(fileName);
    
    await fileRef.delete();
    return true;
  } catch (error) {
    console.error('خطأ في حذف الملف من Firebase:', error);
    return false;
  }
}

// فحص حالة اتصال Firebase
export async function checkFirebaseHealth(): Promise<{
  auth: boolean;
  storage: boolean;
  initialized: boolean;
}> {
  let authHealthy = false;
  let storageHealthy = false;

  try {
    if (isFirebaseInitialized && firebaseApp) {
      // فحص Auth
      try {
        const auth = getAuth(firebaseApp);
        await auth.listUsers(1); // محاولة جلب مستخدم واحد للاختبار
        authHealthy = true;
      } catch (error) {
        console.warn('Firebase Auth غير متاح:', error);
      }

      // فحص Storage
      try {
        if (firebaseStorage) {
          const bucket = firebaseStorage.bucket();
          await bucket.getMetadata(); // محاولة جلب metadata للاختبار
          storageHealthy = true;
        }
      } catch (error) {
        console.warn('Firebase Storage غير متاح:', error);
      }
    }
  } catch (error) {
    console.warn('خطأ عام في فحص Firebase:', error);
  }

  return {
    auth: authHealthy,
    storage: storageHealthy,
    initialized: isFirebaseInitialized
  };
}

// الحصول على Firebase App instance
export function getFirebaseApp() {
  return firebaseApp;
}

// الحصول على Firebase Storage instance
export function getFirebaseStorage() {
  return firebaseStorage;
}

// تصدير حالة التهيئة
export { isFirebaseInitialized };