import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ضمان وجود مجلد التحميلات
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`تم إنشاء مجلد التحميلات: ${UPLOADS_DIR}`);
  } catch (err: any) {
    console.error(`فشل في إنشاء مجلد التحميلات: ${err.message}`);
  }
}

// دالة مساعدة - تحقق من توفر متغيرات البيئة لـ Firebase
const hasRequiredFirebaseEnv = (): boolean => {
  const requiredVars = ['VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_APP_ID'];
  return requiredVars.every(varName => !!process.env[varName]);
};

// تهيئة Firebase Admin SDK مع التعامل مع الأخطاء بشكل أفضل
let firebaseApp: any = undefined;
let firebaseStorage: any = undefined;

try {
  if (hasRequiredFirebaseEnv()) {
    try {
      // تهيئة جديدة باستخدام المعلومات المتوفرة
      firebaseApp = initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`
      });
      firebaseStorage = getStorage(firebaseApp);
      console.log('تم تهيئة Firebase Admin SDK بنجاح');
    } catch (initError: any) {
      console.error('فشل في تهيئة Firebase Admin SDK:', initError);
      throw new Error(`فشل في تهيئة Firebase Admin SDK: ${initError.message}`);
    }
  } else {
    // تهيئة بسيطة للتطوير فقط
    console.warn('تهيئة Firebase بوضع التطوير - متغيرات البيئة مفقودة');
    firebaseApp = initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "dummy-project-dev"
    });
  }
} catch (error) {
  console.error('خطأ في تهيئة Firebase Admin SDK:', error);
}

/**
 * تحميل ملف إلى Firebase Storage أو نظام الملفات المحلي
 * @param file الملف الذي سيتم تحميله (Buffer أو مسار)
 * @param destination مسار الوجهة في Firebase Storage
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
    // إعداد المسار المستهدف
    const fileName = destination.split('/').pop() || `file_${Date.now()}`;
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // تحديد نوع المحتوى استناداً إلى امتداد الملف
    const extension = path.extname(fileName).toLowerCase();
    const detectedContentType = contentType || getContentTypeFromExtension(extension);
    
    // إضافة طابع زمني وهاش للتأكد من فريدية الملف
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(4).toString('hex');
    const uniqueFileName = `${path.parse(safeFileName).name}_${timestamp}_${randomHash}${extension}`;
    
    // نعمل بطريقة بديلة حتى لا نتكل على Firebase Storage
    let isFirebaseAvailable = false;
    try {
      if (firebaseStorage) {
        isFirebaseAvailable = true;
      }
    } catch (error) {
      console.log('Firebase Storage غير متاح. سيتم تخزين الملف محلياً فقط');
    }
    
    // تحميل محلي إذا كان Firebase غير متاح
    if (!isFirebaseAvailable) {
      try {
        // تحضير Buffer إذا كان المدخل ملفاً
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
        
        // إنشاء مسار محلي للتخزين
        const uploadDirPath = path.join(UPLOADS_DIR, path.dirname(destination));
        if (!fs.existsSync(uploadDirPath)) {
          fs.mkdirSync(uploadDirPath, { recursive: true });
        }
        
        // حفظ الملف محلياً
        const localPath = path.join(UPLOADS_DIR, uniqueFileName);
        fs.writeFileSync(localPath, fileBuffer);
        console.log(`تم تخزين الملف محلياً في: ${localPath}`);
        
        // إنشاء URL محلي
        return `/uploads/${uniqueFileName}`;
      } catch (localError: any) {
        console.error('خطأ في حفظ الملف محلياً:', localError);
        throw new Error(`فشل في حفظ الملف محلياً: ${localError.message}`);
      }
    }
    
    // تحميل إلى Firebase Storage
    const bucket = firebaseStorage.bucket();
    
    // تحضير البيانات للتحميل
    let buffer: Buffer;
    if (typeof fileData === 'string') {
      // التأكد من وجود الملف
      if (!fs.existsSync(fileData)) {
        throw new Error(`الملف غير موجود: ${fileData}`);
      }
      buffer = fs.readFileSync(fileData);
    } else {
      buffer = fileData;
    }
    
    // مسار الملف في Firebase
    const storagePath = `${path.dirname(destination)}/${uniqueFileName}`;
    const file = bucket.file(storagePath);
    
    // تجهيز البيانات الوصفية
    const combinedMetadata = {
      contentType: detectedContentType,
      metadata: {
        ...metadata,
        uploadTimestamp: timestamp.toString(),
        originalFileName: fileName
      }
    };
    
    return new Promise<string>((resolve, reject) => {
      // إنشاء التدفق
      const uploadStream = file.createWriteStream({
        metadata: combinedMetadata,
        resumable: buffer.length > 5 * 1024 * 1024 // استئناف التحميل للملفات الكبيرة فقط
      });
      
      // معالجة الأخطاء
      uploadStream.on('error', (error: Error) => {
        console.error('خطأ في تحميل الملف:', error);
        reject(new Error(`فشل في تحميل الملف: ${error.message}`));
      });
      
      // بعد الانتهاء
      uploadStream.on('finish', async () => {
        try {
          // جعل الملف متاحًا للعامة
          await file.makePublic();
          
          // إنشاء URL عام
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
          console.log('تم تحميل الملف بنجاح:', publicUrl);
          resolve(publicUrl);
        } catch (makePublicError: any) {
          console.error('خطأ في جعل الملف عاماً:', makePublicError);
          
          // محاولة إنشاء رابط مؤقت كخطة بديلة
          try {
            const signedUrl = await file.getSignedUrl({
              action: 'read',
              expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // صالح لمدة أسبوع
            });
            console.log('تم إنشاء رابط مؤقت للملف:', signedUrl[0]);
            resolve(signedUrl[0]);
          } catch (signedUrlError) {
            reject(new Error(`فشل في إنشاء رابط للملف: ${makePublicError.message}`));
          }
        }
      });
      
      // إرسال البيانات
      uploadStream.end(buffer);
    });
  } catch (error: any) {
    console.error('خطأ في عملية تحميل الملف:', error);
    throw new Error(`فشل في عملية تحميل الملف: ${error.message}`);
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
 * حذف ملف من Firebase Storage أو من الملفات المحلية
 * @param fileUrl عنوان URL للملف المراد حذفه
 * @returns وعد يشير إلى اكتمال عملية الحذف
 */
export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  if (!fileUrl) {
    console.warn('تم استدعاء deleteFile بدون عنوان URL للملف');
    return false;
  }
  
  try {
    // معالجة المسارات المحلية
    const isLocalPath = fileUrl.startsWith('./uploads/') || 
                        fileUrl.startsWith('/uploads/') || 
                        fileUrl.includes(UPLOADS_DIR);
    
    if (isLocalPath) {
      try {
        // تحديد المسار الكامل للملف
        let fullPath = fileUrl;
        
        // إذا كان المسار نسبيًا، قم بتوسيعه
        if (fileUrl.startsWith('/uploads/')) {
          fullPath = path.join(process.cwd(), fileUrl);
        } else if (fileUrl.startsWith('./uploads/')) {
          fullPath = path.join(process.cwd(), fileUrl.substring(1));
        }
        
        // التحقق من وجود الملف قبل محاولة حذفه
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`تم حذف الملف المحلي بنجاح: ${fullPath}`);
          return true;
        } else {
          console.warn(`الملف المحلي غير موجود: ${fullPath}`);
          return false;
        }
      } catch (localError: any) {
        console.error('خطأ في حذف الملف المحلي:', localError);
        throw new Error(`فشل في حذف الملف المحلي: ${localError.message}`);
      }
    }
    
    // التحقق من توفر Firebase Storage
    let isFirebaseAvailable = false;
    try {
      if (firebaseStorage) {
        isFirebaseAvailable = true;
      }
    } catch (error: any) {
      console.error('Firebase Storage غير متاح للحذف:', error);
      throw new Error('خدمة Firebase Storage غير متاحة لعملية الحذف');
    }
    
    if (!isFirebaseAvailable) {
      throw new Error('خدمة Firebase Storage غير متاحة وعنوان الملف ليس مسارًا محليًا');
    }

    // معالجة روابط Firebase العامة
    const isFirebaseUrl = fileUrl.includes('storage.googleapis.com') || 
                          fileUrl.includes('firebasestorage.googleapis.com');
    
    if (!isFirebaseUrl) {
      throw new Error(`عنوان URL غير مدعوم للحذف: ${fileUrl}`);
    }
    
    // الحصول على مرجع الملف من URL
    const bucket = firebaseStorage.bucket();
    let filePath = '';
    
    if (fileUrl.includes('storage.googleapis.com')) {
      // التنسيق: https://storage.googleapis.com/BUCKET_NAME/FILE_PATH
      const urlParts = fileUrl.split('/');
      if (urlParts.length < 5) {
        throw new Error(`تنسيق URL غير صالح: ${fileUrl}`);
      }
      filePath = urlParts.slice(4).join('/'); // تخطي https:, '', storage.googleapis.com, BUCKET_NAME
    } else if (fileUrl.includes('firebasestorage.googleapis.com')) {
      // استخراج المسار من URL الآخر
      // التنسيق المحتمل: https://firebasestorage.googleapis.com/v0/b/BUCKET_NAME/o/FILE_PATH?token=...
      const matches = fileUrl.match(/\/o\/([^?]+)/);
      if (matches && matches[1]) {
        // فك ترميز المسار (قد يكون مُشفرًا بـ URL encoding)
        filePath = decodeURIComponent(matches[1]);
      }
    }
    
    if (!filePath) {
      throw new Error(`تعذر استخراج مسار الملف من URL: ${fileUrl}`);
    }
    
    // التحقق من وجود الملف قبل محاولة حذفه
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    
    if (!exists) {
      console.warn(`الملف غير موجود في Firebase Storage: ${filePath}`);
      return false;
    }
    
    // حذف الملف
    console.log(`جاري حذف الملف من Firebase Storage: ${filePath}`);
    await file.delete();
    console.log(`تم حذف الملف بنجاح: ${filePath}`);
    return true;
  } catch (error: any) {
    console.error('خطأ في حذف الملف:', error);
    throw new Error(`فشل في حذف الملف: ${error.message}`);
  }
};