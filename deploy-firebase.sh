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

# بناء التطبيق للإنتاج
echo "📦 بناء التطبيق للإنتاج..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ فشل في بناء التطبيق"
    exit 1
fi

# نشر التطبيق على Firebase Hosting
echo "🌐 نشر التطبيق على Firebase Hosting..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo "✅ تم نشر التطبيق بنجاح على Firebase Hosting!"
    echo "🔗 يمكنك الوصول للتطبيق على:"
    firebase hosting:channel:open live
else
    echo "❌ فشل في نشر التطبيق"
    exit 1
fi