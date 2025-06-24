# دليل نشر البرنامج على Hostinger

## متطلبات النشر

### 1. متطلبات الخادم
- Node.js v18 أو أحدث
- PostgreSQL 13 أو أحدث
- مساحة تخزين كافية للملفات المرفوعة

### 2. متغيرات البيئة المطلوبة
قم بإنشاء ملف `.env` في الجذر مع المتغيرات التالية:

```env
# قاعدة البيانات
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# المنفذ
PORT=3000

# بيئة التشغيل
NODE_ENV=production

# سر الجلسة (يجب أن يكون سلسلة عشوائية طويلة)
SESSION_SECRET=your-very-long-random-secret-key-here

# إعدادات Firebase (اختيارية - للملفات)
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

## خطوات النشر

### 1. تحضير الملفات
```bash
# بناء الواجهة الأمامية والخادم
npm run build

# تثبيت التبعيات للإنتاج فقط
npm ci --production
```

### 2. إعداد قاعدة البيانات
```bash
# إنشاء الجداول
npm run db:push
```

### 3. تشغيل البرنامج
```bash
# بدء الخادم
npm start
```

## إعداد Hostinger

### 1. رفع الملفات
ارفع جميع الملفات عبر cPanel File Manager أو FTP:
- جميع ملفات المشروع
- مجلد `node_modules`
- ملف `.env`

### 2. إعداد قاعدة البيانات
1. أنشئ قاعدة بيانات PostgreSQL من cPanel
2. احصل على بيانات الاتصال
3. أدخل بيانات الاتصال في `DATABASE_URL`

### 3. إعداد Node.js App
1. من cPanel، اذهب إلى Node.js Apps
2. أنشئ تطبيق جديد
3. اختر Node.js version 18+
4. اختر مجلد التطبيق
5. أدخل startup file: `dist/index.js`

### 4. تكوين المتغيرات
أضف متغيرات البيئة في إعدادات Node.js App

## الملفات المهمة للنشر

### الملفات الأساسية:
- `package.json` - تعريف التبعيات
- `dist/` - الملفات المبنية
- `uploads/` - مجلد الملفات المرفوعة
- `client/` - ملفات الواجهة الأمامية
- `shared/` - الملفات المشتركة
- `.env` - متغيرات البيئة

### ملفات قاعدة البيانات:
- `server/db.ts` - إعداد قاعدة البيانات
- `shared/schema.ts` - مخطط قاعدة البيانات
- `drizzle.config.ts` - إعداد Drizzle ORM

## استكشاف الأخطاء

### أخطاء شائعة:
1. **خطأ في الاتصال بقاعدة البيانات**: تحقق من `DATABASE_URL`
2. **خطأ في المنفذ**: تأكد من إعداد `PORT` بشكل صحيح
3. **ملفات مفقودة**: تأكد من رفع جميع الملفات
4. **أخطاء Node.js**: تحقق من إصدار Node.js

### فحص الحالة:
- تحقق من سجلات التطبيق في cPanel
- اختبر الاتصال بقاعدة البيانات
- تأكد من صحة متغيرات البيئة

## الأمان

### إجراءات الأمان المطلوبة:
1. تغيير `SESSION_SECRET` إلى قيمة عشوائية قوية
2. إعداد HTTPS
3. تقييد الوصول لمجلد `uploads`
4. إعداد نسخ احتياطية دورية

## الصيانة

### النسخ الاحتياطية:
- يتم إنشاء نسخ احتياطية تلقائية كل 12 ساعة
- النسخ محفوظة في مجلد `backups/`

### التحديثات:
```bash
# تحديث التبعيات
npm update

# إعادة البناء
npm run build

# إعادة تشغيل الخادم
npm start
```