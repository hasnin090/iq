#!/bin/bash
echo "🔍 بدء اختبار تكوين Netlify..."

# التحقق من وجود ملف netlify.toml
if [ ! -f netlify.toml ]; then
    echo "❌ خطأ: ملف netlify.toml غير موجود!"
    exit 1
else
    echo "✅ ملف netlify.toml موجود"
fi

# التحقق من صحة تنسيق TOML
echo "🔍 جاري التحقق من صحة تنسيق TOML..."

# التحقق من أقسام رئيسية
if ! grep -q "\[build\]" netlify.toml; then
    echo "❌ خطأ: قسم [build] غير موجود في ملف netlify.toml!"
    exit 1
else
    echo "✅ قسم [build] موجود"
fi

if ! grep -q "publish = " netlify.toml; then
    echo "❌ خطأ: publish غير موجود في ملف netlify.toml!"
    exit 1
else
    echo "✅ publish موجود"
fi

if ! grep -q "command = " netlify.toml; then
    echo "❌ خطأ: command غير موجود في ملف netlify.toml!"
    exit 1
else
    echo "✅ command موجود"
fi

if ! grep -q "functions = " netlify.toml; then
    echo "❌ خطأ: functions غير موجود في ملف netlify.toml!"
    exit 1
else
    echo "✅ functions موجود"
fi

# التحقق من وجود مجلد Functions
if [ ! -d "netlify/functions" ]; then
    echo "❌ خطأ: مجلد netlify/functions غير موجود!"
    exit 1
else
    echo "✅ مجلد netlify/functions موجود"
fi

# التحقق من وجود دالة API
if [ ! -f "netlify/functions/api.js" ]; then
    echo "❌ خطأ: ملف netlify/functions/api.js غير موجود!"
    exit 1
else
    echo "✅ دالة API موجودة: netlify/functions/api.js"
fi

# التحقق من وجود ملف _redirects
if [ ! -f "_redirects" ]; then
    echo "❌ خطأ: ملف _redirects غير موجود!"
    exit 1
else
    echo "✅ ملف _redirects موجود"
fi

# التحقق من وجود توجيه API في ملف _redirects
if grep -q "/api/\*.*/.netlify/functions/api/:splat" _redirects; then
    echo "✅ توجيه API موجود في ملف _redirects"
else
    echo "❌ خطأ: توجيه API غير موجود في ملف _redirects!"
    exit 1
fi

# فحص تداخل أقسام TOML
# فحص عدد [functions] sections
functions_count=$(grep -c "\[functions\]" netlify.toml)
if [ "$functions_count" -gt 1 ]; then
    echo "❌ خطأ: يوجد أكثر من قسم [functions] في ملف netlify.toml!"
    exit 1
else
    echo "✅ عدد أقسام [functions] صحيح"
fi

echo "🎉 اختبار تكوين Netlify اكتمل بنجاح!"
