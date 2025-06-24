# دليل إعداد Firebase للنظام الهجين

## مقدمة
يدعم النظام الآن التشغيل المتزامن لثلاثة مزودي تخزين:
- **التخزين المحلي** (افتراضي)
- **Supabase** (سحابي)
- **Firebase** (سحابي)

## خطوات إعداد Firebase

### 1. إنشاء مشروع Firebase
1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. انقر على "إنشاء مشروع" أو "Create a project"
3. اختر اسماً لمشروعك
4. اتبع الخطوات لإكمال إنشاء المشروع

### 2. تفعيل خدمات Firebase المطلوبة

#### أ. Firebase Storage
1. في وحة تحكم Firebase، اذهب إلى "Storage"
2. انقر على "البدء" أو "Get started"
3. اختر قواعد الأمان (يمكن تخصيصها لاحقاً)
4. اختر موقع التخزين الجغرافي

#### ب. Firebase Authentication (اختياري)
1. اذهب إلى "Authentication"
2. انقر على "البدء"
3. اختر طرق تسجيل الدخول المطلوبة

### 3. إنشاء حساب خدمة (Service Account)
1. اذهب إلى "Project Settings" (رمز الترس)
2. اختر تبويب "Service accounts"
3. انقر على "Generate new private key"
4. احفظ الملف JSON الذي تم تحميله

### 4. الحصول على معلومات المشروع
من صفحة "Project Settings" > "General":
- **Project ID**: معرف المشروع
- **Storage Bucket**: عنوان bucket التخزين (مثل: myproject.appspot.com)

## إعداد متغيرات البيئة

أضف المتغيرات التالية إلى ملف `.env`:

```env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### شرح المتغيرات:

#### FIREBASE_SERVICE_ACCOUNT_KEY
محتوى ملف JSON الذي حملته من Firebase. يجب أن يكون على شكل JSON string واحد.

**مثال على البنية:**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service@your-project-id.iam.gserviceaccount.com",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service%40your-project-id.iam.gserviceaccount.com"
}
```

#### FIREBASE_STORAGE_BUCKET
اسم bucket التخزين، عادة ما يكون: `project-id.appspot.com`

## استخدام النظام الهجين

### خصائص النظام:
1. **التبديل التلقائي**: إذا فشل المزود الأساسي، ينتقل النظام تلقائياً للمزود الاحتياطي
2. **مزامنة الملفات**: يمكن رفع ملف واحد إلى عدة مزودات
3. **إدارة مركزية**: واجهة موحدة لإدارة جميع مزودي التخزين

### الوصول لإدارة التخزين الهجين:
- اذهب إلى "إدارة التخزين الهجين" من القائمة الجانبية
- تأكد من أن لديك صلاحيات المدير

### اختبار التكامل:
1. تحقق من حالة Firebase في تبويب "Firebase"
2. انقر على "تهيئة Firebase"
3. تحقق من ظهور علامة ✅ للخدمات المختلفة
4. جرب رفع ملف تجريبي في تبويب "مزامنة الملفات"

## استكشاف الأخطاء

### خطأ "Firebase غير مكون"
- تأكد من وجود متغيرات البيئة
- تحقق من صحة JSON في FIREBASE_SERVICE_ACCOUNT_KEY
- تأكد من إعادة تشغيل الخادم بعد إضافة المتغيرات

### خطأ "Storage غير متاح"
- تحقق من تفعيل Firebase Storage في المشروع
- تأكد من صحة FIREBASE_STORAGE_BUCKET
- تحقق من صلاحيات حساب الخدمة

### خطأ في المصادقة
- تأكد من صحة private_key في ملف JSON
- تحقق من عدم انتهاء صلاحية حساب الخدمة
- تأكد من تفعيل Firebase Admin SDK

## الأمان

### أفضل الممارسات:
1. **لا تشارك ملف الخدمة**: احتفظ بملف JSON آمناً
2. **استخدم متغيرات البيئة**: لا تضع المفاتيح في الكود
3. **قيد الصلاحيات**: أعط حساب الخدمة أقل صلاحيات مطلوبة
4. **راقب الاستخدام**: تابع استخدام Firebase من وحة التحكم

### قواعد الأمان المقترحة لـ Storage:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## دعم متقدم

### التكامل مع النظام الحالي:
- يتم استخدام Firebase تلقائياً كمزود احتياطي
- إذا كان Supabase متاحاً، سيكون هو المزود الاحتياطي الأول
- يمكن تغيير المزود المفضل من واجهة الإدارة

### مراقبة النظام:
- تحقق من سجلات النظام لرسائل Firebase
- استخدم واجهة "إدارة التخزين الهجين" لمراقبة الحالة
- راجع Firebase Console لإحصائيات الاستخدام

---

**ملاحظة**: هذا الإعداد يوفر نظام تخزين هجين قوي ومرن يضمن استمرارية الخدمة حتى لو تعطل أحد مزودي التخزين.