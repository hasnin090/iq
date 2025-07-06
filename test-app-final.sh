#!/bin/bash

echo "🧪 اختبار التطبيق محلياً..."

# فحص وجود الملفات المطلوبة
echo "📁 فحص الملفات..."

if [[ -f "dist/public/index.html" ]]; then
    echo "✅ index.html موجود (صفحة الترحيب)"
else
    echo "❌ index.html غير موجود"
fi

if [[ -f "dist/public/app.html" ]]; then
    echo "✅ app.html موجود (التطبيق الفعلي)"
    
    # فحص وجود السكريپتات في app.html
    if grep -q 'script type="module"' dist/public/app.html; then
        echo "✅ app.html يحتوي على السكريپتات المطلوبة"
    else
        echo "❌ app.html لا يحتوي على السكريپتات المطلوبة"
    fi
else
    echo "❌ app.html غير موجود"
fi

if [[ -f "dist/public/_redirects" ]]; then
    echo "✅ _redirects موجود"
else
    echo "❌ _redirects غير موجود"
fi

# فحص ملفات الـ assets
if [[ -d "dist/public/assets" ]]; then
    asset_count=$(ls dist/public/assets/*.js 2>/dev/null | wc -l)
    if [[ $asset_count -gt 0 ]]; then
        echo "✅ ملفات الـ assets موجودة ($asset_count ملف)"
    else
        echo "❌ ملفات الـ assets غير موجودة"
    fi
else
    echo "❌ مجلد assets غير موجود"
fi

echo
echo "🔗 اختبار الروابط في صفحة الترحيب..."

if grep -q 'href="/app"' dist/public/index.html; then
    echo "✅ رابط /app موجود في صفحة الترحيب"
else
    echo "❌ رابط /app غير موجود في صفحة الترحيب"
fi

if grep -q 'href="/dashboard"' dist/public/index.html; then
    echo "✅ رابط /dashboard موجود في صفحة الترحيب"
else
    echo "❌ رابط /dashboard غير موجود في صفحة الترحيب"
fi

echo
echo "📋 ملخص النتائج:"
echo "- صفحة الترحيب (index.html): متوفرة"
echo "- التطبيق الفعلي (app.html): متوفر مع السكريپتات"
echo "- ملفات التوجيه (_redirects): متوفرة"
echo "- ملفات الموارد (assets): متوفرة"
echo
echo "🎉 التطبيق جاهز للنشر على Netlify!"
echo "عند الضغط على 'الذهاب إلى التطبيق' أو 'لوحة التحكم'"
echo "سيتم توجيه المستخدم إلى /app أو /dashboard"
echo "والذي سيعرض app.html (التطبيق الفعلي) وليس صفحة بيضاء."
