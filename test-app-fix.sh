#!/bin/bash

echo "🧪 اختبار app.html محلياً..."
echo

# تشغيل خادم الويب المحلي
echo "🌐 تشغيل خادم الويب على http://localhost:8080"
echo "📱 لاختبار التطبيق: http://localhost:8080/app.html"
echo "🏠 لاختبار صفحة الترحيب: http://localhost:8080/index.html"
echo
echo "⚠️ تأكد من أن ملف app.html يحتوي على جميع السكريبتات:"

# فحص محتوى app.html
if [ -f "dist/public/app.html" ]; then
  echo "✅ app.html موجود"
  
  if grep -q "script type=\"module\"" "dist/public/app.html"; then
    echo "✅ app.html يحتوي على script tag"
    
    # استخراج اسم ملف JS الرئيسي
    js_file=$(grep -o 'src="/assets/[^"]*\.js"' dist/public/app.html | head -1 | sed 's/src="//g' | sed 's/"//g')
    
    if [ -f "dist/public$js_file" ]; then
      echo "✅ ملف JavaScript الرئيسي موجود: $js_file"
    else
      echo "❌ ملف JavaScript الرئيسي مفقود: $js_file"
    fi
  else
    echo "❌ app.html لا يحتوي على script tag"
  fi
else
  echo "❌ app.html غير موجود"
fi

echo
echo "📋 محتوى ملف _redirects:"
if [ -f "dist/public/_redirects" ]; then
  cat dist/public/_redirects
else
  echo "❌ ملف _redirects غير موجود"
fi

echo
echo "🔄 لإعادة البناء: npm run build أو node netlify-404-build.js"
echo "🚀 بعد النشر على Netlify، اختبر:"
echo "   - صفحة الترحيب: https://your-app.netlify.app/"
echo "   - التطبيق: https://your-app.netlify.app/app"
echo "   - لوحة التحكم: https://your-app.netlify.app/dashboard"
