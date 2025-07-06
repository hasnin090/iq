#!/bin/bash
echo "🔍 بدء اختبار ملف _redirects..."

# التحقق من وجود ملف _redirects
if [ ! -f "_redirects" ]; then
    echo "❌ خطأ: ملف _redirects غير موجود!"
    exit 1
else
    echo "✅ ملف _redirects موجود"
fi

# التحقق من وجود توجيه API
if grep -q "/api/\*.*/.netlify/functions/api/:splat" _redirects; then
    echo "✅ توجيه API موجود في ملف _redirects"
else
    echo "❌ خطأ: توجيه API غير موجود في ملف _redirects!"
    exit 1
fi

# التحقق من وجود توجيه SPA
if grep -q "/\*.*index.html" _redirects; then
    echo "✅ توجيه SPA موجود في ملف _redirects"
else
    echo "❌ خطأ: توجيه SPA غير موجود في ملف _redirects!"
    exit 1
fi

# التحقق من وجود ملف _redirects في مجلد public
if [ -f "public/_redirects" ]; then
    echo "✅ ملف _redirects موجود في مجلد public"
    
    # التحقق من تطابق الملفين
    if diff -q _redirects public/_redirects >/dev/null; then
        echo "✅ ملفات _redirects متطابقة"
    else
        echo "⚠️ تحذير: ملفات _redirects غير متطابقة!"
        echo "المحتوى المختلف:"
        diff _redirects public/_redirects
    fi
else
    echo "⚠️ تحذير: ملف public/_redirects غير موجود! سيتم إنشاؤه أثناء البناء."
fi

echo "🎉 اختبار ملف _redirects اكتمل بنجاح!"
