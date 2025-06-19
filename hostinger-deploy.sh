#!/bin/bash

echo "🚀 تحضير البرنامج للنشر على Hostinger..."

# إنشاء مجلد النشر
mkdir -p deploy-package

# بناء البرنامج
echo "📦 بناء البرنامج..."
npm run build

# نسخ الملفات المطلوبة
echo "📁 نسخ الملفات..."
cp -r dist/* deploy-package/
cp package.json deploy-package/
cp .env.example deploy-package/

# نسخ مجلد shared إذا كان موجوداً
if [ -d "shared" ]; then
    cp -r shared deploy-package/
fi

# إنشاء المجلدات المطلوبة
mkdir -p deploy-package/uploads
mkdir -p deploy-package/backups

# إنشاء ملف package.json مبسط للإنتاج
cat > deploy-package/package.json << 'EOF'
{
  "name": "accounting-system",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "NODE_ENV=production node index.js",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.10.4",
    "bcryptjs": "^3.0.2",
    "connect-pg-simple": "^10.0.0",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "multer": "^1.4.5-lts.2",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "pg": "^8.14.1",
    "uuid": "^11.1.0",
    "zod": "^3.23.8",
    "archiver": "^7.0.1"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.4"
  }
}
EOF

# إنشاء ملف تعليمات النشر
cat > deploy-package/DEPLOY-INSTRUCTIONS.txt << 'EOF'
تعليمات نشر البرنامج على Hostinger
=====================================

1. رفع الملفات:
   - ارفع جميع ملفات هذا المجلد إلى خادم Hostinger

2. إعداد قاعدة البيانات:
   - أنشئ قاعدة بيانات PostgreSQL من cPanel
   - احصل على بيانات الاتصال

3. إعداد متغيرات البيئة:
   - انسخ .env.example إلى .env
   - أدخل بيانات قاعدة البيانات الصحيحة
   - غير SESSION_SECRET إلى قيمة عشوائية قوية

4. إعداد Node.js App:
   - من cPanel > Node.js Apps
   - اختر Node.js v18+
   - Startup file: index.js
   - أضف متغيرات البيئة

5. إنشاء الجداول:
   npm run db:push

6. تشغيل البرنامج:
   npm start

بيانات تسجيل الدخول الافتراضية:
اسم المستخدم: admin
كلمة المرور: admin123
EOF

echo "✅ تم تحضير البرنامج بنجاح!"
echo "📦 الملفات جاهزة في مجلد: deploy-package/"
echo "📋 راجع DEPLOY-INSTRUCTIONS.txt للتعليمات التفصيلية"