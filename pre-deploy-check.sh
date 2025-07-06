#!/bin/bash
echo "🚀 بدء اختبار شامل قبل الرفع..."

# تأكد من أن الأدوات قابلة للتنفيذ
chmod +x check-netlify-config.sh
chmod +x check-redirects.sh

# اختبار تكوين Netlify
echo "------------------------------"
echo "🔍 اختبار تكوين Netlify"
echo "------------------------------"
./check-netlify-config.sh
if [ $? -ne 0 ]; then
    echo "❌ فشل اختبار تكوين Netlify!"
    exit 1
fi

# اختبار دالة API
echo "------------------------------"
echo "🔍 اختبار دالة API"
echo "------------------------------"
node ./test-api.js
if [ $? -ne 0 ]; then
    echo "❌ فشل اختبار دالة API!"
    exit 1
fi

# اختبار ملف _redirects
echo "------------------------------"
echo "🔍 اختبار ملف _redirects"
echo "------------------------------"
./check-redirects.sh
if [ $? -ne 0 ]; then
    echo "❌ فشل اختبار ملف _redirects!"
    exit 1
fi

# اختبار بناء تجريبي سريع
echo "------------------------------"
echo "🔍 اختبار صحة ملف netlify.toml"
echo "------------------------------"

# إنشاء نسخة مؤقتة من ملف netlify.toml
cp netlify.toml netlify.toml.bak

# عرض محتوى ملف netlify.toml
echo "📋 محتوى ملف netlify.toml:"
cat netlify.toml | grep -v "^#" | grep -v "^$"

echo ""
echo "⚠️ تحذير: تأكد من أن محتوى الملف صحيح ولا يحتوي على أخطاء تنسيق."
echo "هل محتوى الملف صحيح؟ (y/n)"
read -r answer

if [ "$answer" != "y" ]; then
    echo "🔄 الرجاء تصحيح الملف قبل المتابعة."
    exit 1
fi

echo "🎉 الاختبار الشامل اكتمل بنجاح! المشروع جاهز للرفع."
