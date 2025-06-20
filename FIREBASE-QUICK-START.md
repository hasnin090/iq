# Firebase Hosting - دليل البدء السريع

## خطوات النشر السريع (5 دقائق)

### 1. إعداد مشروع Firebase
```bash
# تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول
firebase login

# إعداد المشروع
./firebase-init.sh
```

### 2. إنشاء ملف البيئة
انسخ `.env.example` إلى `.env.local` وأدخل إعدادات Firebase:
```bash
cp .env.example .env.local
```

املأ المتغيرات التالية في `.env.local`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-id
VITE_FIREBASE_STORAGE_BUCKET=project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=sender_id
VITE_FIREBASE_APP_ID=app_id
```

### 3. بناء ونشر التطبيق
```bash
# بناء التطبيق
npm run build

# النشر
./deploy-firebase.sh
```

## الحصول على إعدادات Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك
3. اذهب إلى Settings > General
4. في قسم "Your apps"، انقر على الأيقونة </> 
5. انسخ configuration object

## الخدمات المطلوبة

في Firebase Console، فعّل الخدمات التالية:

### Firestore Database
1. اذهب إلى Firestore Database
2. انقر على "Create database"
3. اختر "Start in test mode"
4. اختر موقع قريب (مثل europe-west3)

### Storage
1. اذهب إلى Storage
2. انقر على "Get started"
3. اختر "Start in test mode"

### Hosting (تلقائي)
يتم تفعيله تلقائياً عند النشر

## إعدادات الأمان

تم إعداد قواعد الأمان مسبقاً في:
- `firestore.rules` - حماية قاعدة البيانات
- `storage.rules` - حماية الملفات

## استكشاف الأخطاء

### خطأ: Firebase not initialized
تأكد من صحة إعدادات `.env.local`

### خطأ: Permission denied
راجع قواعد Firestore في Firebase Console

### خطأ: Build failed
تأكد من تثبيت جميع التبعيات: `npm install`

## روابط مفيدة

- [Firebase Console](https://console.firebase.google.com/)
- [دليل النشر الكامل](./FIREBASE-DEPLOYMENT-GUIDE.md)
- [Firebase Documentation](https://firebase.google.com/docs)