# نقل البرنامج إلى Hostinger - دليل سريع

## الخطوات الأساسية

### 1. بناء البرنامج للإنتاج
```bash
npm run build
```

### 2. تحضير الملفات للرفع
الملفات المطلوبة للرفع على Hostinger:
- `dist/` - ملفات البرنامج المبنية
- `node_modules/` - مكتبات Node.js
- `package.json`
- `uploads/` - مجلد الملفات (فارغ في البداية)
- `backups/` - مجلد النسخ الاحتياطية (فارغ في البداية)

### 3. إعداد قاعدة البيانات في Hostinger
1. من cPanel اذهب إلى PostgreSQL Databases
2. أنشئ قاعدة بيانات جديدة
3. أنشئ مستخدم وربطه بقاعدة البيانات
4. احفظ بيانات الاتصال

### 4. إعداد متغيرات البيئة
أنشئ ملف `.env` في مجلد البرنامج:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-random-secret-key-32-chars-minimum
```

### 5. إعداد Node.js App في cPanel
1. اذهب إلى Node.js Apps
2. Create App:
   - Node.js version: 18 أو أحدث
   - App URL: اختر النطاق
   - App Root: مجلد البرنامج
   - Application startup file: `dist/index.js`
3. أضف متغيرات البيئة في تبويب Environment Variables

### 6. إنشاء جداول قاعدة البيانات
من Terminal في cPanel:
```bash
cd /path/to/your/app
npm run db:push
```

### 7. تشغيل البرنامج
اضغط "Start App" في Node.js Apps

## إعدادات إضافية

### الأمان
- غير SESSION_SECRET إلى قيمة عشوائية قوية
- تأكد من تفعيل SSL في Hostinger

### النسخ الاحتياطية
- النظام ينشئ نسخ احتياطية تلقائية كل 12 ساعة
- النسخ محفوظة في مجلد `backups/`

### استكشاف الأخطاء
- تحقق من Error Logs في cPanel
- تأكد من صحة DATABASE_URL
- تحقق من أن جميع المكتبات مثبتة

## معلومات مهمة
- البرنامج يستخدم PostgreSQL (وليس MySQL)
- يتطلب Node.js v18 أو أحدث
- حجم الرفع المتوقع: ~200MB تقريباً