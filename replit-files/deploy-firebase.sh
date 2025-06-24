#!/bin/bash

# Firebase Hosting Deployment Script for Arabic Accounting System
echo "🚀 بدء عملية النشر على Firebase Hosting..."

# التحقق من وجود Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI غير مثبت. يرجى تثبيته أولاً:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# التحقق من تسجيل الدخول
if ! firebase projects:list &> /dev/null; then
    echo "🔐 يرجى تسجيل الدخول إلى Firebase:"
    firebase login
fi

# التحقق من وجود ملف التكوين
if [ ! -f ".env.local" ]; then
    echo "⚠️  ملف .env.local غير موجود. يرجى إنشاؤه مع إعدادات Firebase"
    echo "راجع دليل النشر FIREBASE-DEPLOYMENT-GUIDE.md للتفاصيل"
fi

# بناء التطبيق للإنتاج
echo "📦 بناء التطبيق للإنتاج..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ فشل في بناء التطبيق"
    exit 1
fi

# نشر قواعد Firestore و Storage أولاً
echo "🔒 نشر قواعد الأمان..."
firebase deploy --only firestore:rules,storage

if [ $? -ne 0 ]; then
    echo "⚠️  تحذير: فشل في نشر قواعد الأمان"
fi

# نشر التطبيق على Firebase Hosting
echo "🌐 نشر التطبيق على Firebase Hosting..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo "✅ تم نشر التطبيق بنجاح على Firebase Hosting!"
    echo ""
    echo "📋 الخطوات التالية:"
    echo "1. قم بإعداد Firestore Database في Firebase Console"
    echo "2. قم بإعداد Firebase Storage"
    echo "3. قم بإعداد Authentication (اختياري)"
    echo ""
    echo "🔗 يمكنك الوصول للتطبيق على:"
    firebase hosting:channel:open live 2>/dev/null || firebase open hosting:site
else
    echo "❌ فشل في نشر التطبيق"
    exit 1
fi