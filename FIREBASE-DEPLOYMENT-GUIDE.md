# دليل النشر على Firebase Hosting

## نظرة عامة
تم إعداد نظام المحاسبة العربي للنشر على Firebase Hosting مع دعم كامل لـ:
- استضافة التطبيق على Firebase Hosting
- تخزين البيانات في Firestore
- تخزين الملفات في Firebase Storage
- نظام المصادقة (اختياري)

## المتطلبات الأساسية

### 1. تثبيت Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. تسجيل الدخول لـ Firebase
```bash
firebase login
```

### 3. إنشاء مشروع Firebase جديد
1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. انقر على "Add project" (إضافة مشروع)
3. اختر اسم المشروع
4. فعّل Google Analytics (اختياري)

## إعداد المشروع

### 1. ربط المشروع المحلي بـ Firebase
```bash
firebase init
```

اختر الخدمات التالية:
- ✅ Firestore: Configure security rules and indexes files
- ✅ Hosting: Configure files for Firebase Hosting
- ✅ Storage: Configure a security rules file for Cloud Storage

### 2. تكوين Firestore
- اختر "Use an existing project"
- اختر مشروعك
- استخدم الملف الموجود: `firestore.rules`
- استخدم الملف الموجود: `firestore.indexes.json`

### 3. تكوين Hosting
- اختر `dist` كمجلد public
- اختر "Yes" لتكوين SPA
- اختر "No" لعدم الكتابة فوق index.html

### 4. تكوين Storage
- استخدم الملف الموجود: `storage.rules`

## متغيرات البيئة

### 1. إنشاء ملف .env.local
أنشئ ملف `.env.local` في جذر المشروع:
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Database (للاستخدام المحلي فقط)
DATABASE_URL=your_neon_database_url
```

### 2. الحصول على إعدادات Firebase
1. اذهب إلى Project Settings في Firebase Console
2. انتقل إلى "General" tab
3. في قسم "Your apps"، انقر على "Config"
4. انسخ القيم إلى ملف .env.local

## عملية النشر

### 1. بناء التطبيق
```bash
npm run build
```

### 2. النشر باستخدام النص البرمجي المجهز
```bash
./deploy-firebase.sh
```

أو النشر يدوياً:
```bash
firebase deploy
```

### 3. النشر لـ Hosting فقط
```bash
firebase deploy --only hosting
```

## الأوامر المفيدة

### معاينة التطبيق محلياً
```bash
firebase serve
```

### مراقبة Logs
```bash
firebase functions:log
```

### إدارة المشاريع
```bash
# عرض المشاريع المتاحة
firebase projects:list

# تغيير المشروع الحالي
firebase use project-id
```

## إعداد قاعدة البيانات

### 1. Firestore Rules
تم إعداد قواعد الأمان في `firestore.rules` لتتيح:
- القراءة والكتابة للمستخدمين المسجلين
- حماية البيانات الشخصية
- تقييد الوصول حسب المستخدم

### 2. Storage Rules
تم إعداد قواعد التخزين في `storage.rules` لتتيح:
- رفع الملفات للمستخدمين المسجلين
- تنظيم الملفات في مجلدات محددة
- حماية الملفات من الوصول غير المسموح

### 3. Indexes
تم إعداد فهارس Firestore في `firestore.indexes.json` لتحسين:
- استعلامات المعاملات حسب المشروع والتاريخ
- استعلامات المدفوعات المؤجلة حسب الحالة
- استعلامات المستندات حسب المشروع

## الهيكل النهائي

```
project/
├── dist/                    # ملفات التطبيق المبنية
├── firebase.json           # تكوين Firebase
├── firestore.rules        # قواعد أمان Firestore
├── firestore.indexes.json # فهارس Firestore
├── storage.rules          # قواعد أمان Storage
├── deploy-firebase.sh     # نص النشر التلقائي
└── .env.local            # متغيرات البيئة
```

## مراقبة الأداء

### Firebase Console
- مراقبة الاستخدام
- تحليل الأداء
- مراجعة Logs
- إدارة المستخدمين

### تحسين الأداء
- تفعيل CDN للملفات الثابتة
- ضغط الصور تلقائياً
- تخزين مؤقت للبيانات
- فهرسة محسنة للاستعلامات

## استكشاف الأخطاء

### أخطاء شائعة
1. **API Key Invalid**: تأكد من صحة API keys في .env.local
2. **Permission Denied**: راجع قواعد Firestore/Storage
3. **Build Errors**: تأكد من تثبيت جميع التبعيات
4. **CORS Errors**: تأكد من إعداد النطاقات المسموحة

### حلول سريعة
```bash
# إعادة تثبيت التبعيات
npm install

# تنظيف cache
npm run build --clean

# إعادة نشر القواعد فقط
firebase deploy --only firestore:rules,storage
```

## الأمان

### حماية API Keys
- لا تضع API keys في الكود المصدري
- استخدم متغيرات البيئة دائماً
- قم بتقييد API keys في Firebase Console

### قواعد الأمان
- راجع وحدث قواعد Firestore بانتظام
- اختبر القواعد باستخدام Firebase Emulator
- راقب محاولات الوصول المشبوهة

## الدعم والمساعدة

### الموارد المفيدة
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)

### المساعدة التقنية
في حالة واجهت مشاكل:
1. راجع Firebase Console للأخطاء
2. تحقق من browser console
3. راجع قواعد الأمان
4. اختبر محلياً أولاً