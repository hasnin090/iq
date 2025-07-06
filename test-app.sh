#!/bin/bash

echo "🧪 اختبار app.html محلياً..."
echo

# التحقق من وجود الملفات
echo "📁 التحقق من الملفات المطلوبة:"

if [ -f "dist/public/app.html" ]; then
  echo "✅ app.html موجود"
else
  echo "❌ app.html غير موجود!"
  exit 1
fi

if [ -f "dist/public/index.html" ]; then
  echo "✅ index.html موجود"
else
  echo "❌ index.html غير موجود!"
  exit 1
fi

if [ -d "dist/public/assets" ]; then
  echo "✅ مجلد assets موجود"
  echo "📄 ملفات assets:"
  ls -la dist/public/assets/ | grep -E '\.(js|css)$' | awk '{print "  " $9}'
else
  echo "❌ مجلد assets غير موجود!"
  exit 1
fi

echo
echo "🔍 فحص محتوى app.html:"

# التحقق من وجود script tag
if grep -q '<script.*src="/assets/index-.*\.js"' dist/public/app.html; then
  echo "✅ script tag موجود في app.html"
  script_src=$(grep -o 'src="/assets/index-[^"]*\.js"' dist/public/app.html)
  echo "   $script_src"
else
  echo "❌ script tag غير موجود في app.html!"
fi

# التحقق من وجود root div
if grep -q '<div id="root">' dist/public/app.html; then
  echo "✅ root div موجود في app.html"
else
  echo "❌ root div غير موجود في app.html!"
fi

echo
echo "🔍 فحص محتوى index.html:"

# التحقق من أن index.html هو صفحة الترحيب
if grep -q "الذهاب إلى التطبيق" dist/public/index.html; then
  echo "✅ index.html يحتوي على صفحة الترحيب"
else
  echo "❌ index.html لا يحتوي على صفحة الترحيب!"
fi

echo
echo "🔍 فحص _redirects:"

if [ -f "dist/public/_redirects" ]; then
  echo "✅ ملف _redirects موجود"
  if grep -q "/app" dist/public/_redirects && grep -q "app.html" dist/public/_redirects; then
    echo "✅ توجيه /app إلى app.html موجود"
  else
    echo "❌ توجيه /app إلى app.html غير موجود!"
    echo "📄 محتوى _redirects:"
    head -10 dist/public/_redirects
  fi
else
  echo "❌ ملف _redirects غير موجود!"
fi

echo
echo "🎯 ملخص نهائي:"
echo "📁 dist/public/index.html - صفحة الترحيب"
echo "📁 dist/public/app.html - التطبيق الفعلي مع السكريبتات"
echo "📁 dist/public/assets/ - ملفات التطبيق المبنية"
echo "📁 dist/public/_redirects - التوجيهات"
echo
echo "🚀 جاهز للنشر على Netlify!"
echo "💡 عند الضغط على 'الذهاب إلى التطبيق' سيتم توجيهك إلى app.html"
