#!/bin/bash

# Firebase Project Initialization Script
echo "🔧 إعداد مشروع Firebase للنظام المحاسبي العربي"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI غير مثبت. جاري التثبيت..."
    npm install -g firebase-tools
fi

# Login to Firebase
echo "🔐 تسجيل الدخول إلى Firebase..."
firebase login

# Initialize Firebase project
echo "🚀 إنشاء مشروع Firebase جديد..."
firebase init

echo ""
echo "📋 خطوات الإعداد المطلوبة:"
echo "1. اختر 'Create a new project'"
echo "2. ادخل اسم المشروع (مثل: arabic-accounting-system)"
echo "3. اختر الخدمات التالية:"
echo "   ✅ Firestore: Configure security rules and indexes"
echo "   ✅ Hosting: Configure files for Firebase Hosting"
echo "   ✅ Storage: Configure a security rules file"
echo ""
echo "4. إعدادات Firestore:"
echo "   - استخدم الملف الموجود: firestore.rules"
echo "   - استخدم الملف الموجود: firestore.indexes.json"
echo ""
echo "5. إعدادات Hosting:"
echo "   - اختر 'dist' كمجلد public"
echo "   - اختر 'Yes' لتكوين SPA"
echo "   - اختر 'No' لعدم الكتابة فوق index.html"
echo ""
echo "6. إعدادات Storage:"
echo "   - استخدم الملف الموجود: storage.rules"
echo ""

# Create .env.local template
if [ ! -f ".env.local" ]; then
    echo "📝 إنشاء ملف .env.local..."
    cp .env.example .env.local
    echo "⚠️  يرجى تحديث .env.local بإعدادات Firebase الخاصة بك"
fi

echo ""
echo "✅ تم إكمال الإعداد الأولي!"
echo "🔑 لا تنس تحديث ملف .env.local بمفاتيح Firebase"
echo "📖 راجع دليل النشر FIREBASE-DEPLOYMENT-GUIDE.md للتفاصيل"