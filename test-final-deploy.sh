#!/bin/bash

# Script to perform final Netlify deployment test
echo "========== اختبار النشر النهائي على Netlify =========="
echo

# 1. Check for build prerequisites
echo "🔍 التحقق من متطلبات البناء..."
if [ -f netlify-404-build.js ]; then
  echo "✅ ملف البناء netlify-404-build.js موجود"
else
  echo "❌ ملف البناء netlify-404-build.js غير موجود!"
  exit 1
fi

if [ -f improved-welcome-page.html ]; then
  echo "✅ صفحة الترحيب المحسنة موجودة"
else
  echo "❌ صفحة الترحيب المحسنة غير موجودة!"
  exit 1
fi

# 2. Check Netlify function files
echo -e "\n🔍 التحقق من ملفات وظائف Netlify..."
if [ -f netlify/functions/api.js ]; then
  echo "✅ ملف وظيفة API موجود"
  
  # Check API function exports
  if grep -q "exports.handler = async" netlify/functions/api.js; then
    echo "✅ تصدير handler في ملف API صحيح"
  else
    echo "❌ خطأ في تصدير handler في ملف API!"
    exit 1
  fi
  
  # Check for double export
  if grep -q "module.exports = { handler: exports.handler }" netlify/functions/api.js; then
    echo "❌ تصدير مزدوج قد يسبب خطأ في API!"
    exit 1
  else
    echo "✅ لا يوجد تصدير مزدوج في ملف API"
  fi
else
  echo "❌ ملف وظيفة API غير موجود!"
  exit 1
fi

if [ -f netlify/functions/test.js ]; then
  echo "✅ ملف وظيفة الاختبار موجود"
else
  echo "❌ ملف وظيفة الاختبار غير موجود!"
  exit 1
fi

# 3. Run the build script to test it
echo -e "\n🏗️ اختبار سكريبت البناء..."
node netlify-404-build.js

# 4. Verify the build output
echo -e "\n🔍 التحقق من نتائج البناء..."
if [ -f dist/public/index.html ]; then
  echo "✅ تم إنشاء ملف index.html"
  
  # Check if the improved welcome page was used
  if grep -q "نظام المحاسبة العربي" dist/public/index.html; then
    echo "✅ صفحة الترحيب المحسنة تم استخدامها"
  else
    echo "⚠️ صفحة الترحيب المحسنة لم يتم استخدامها!"
  fi
else
  echo "❌ فشل في إنشاء ملف index.html!"
  exit 1
fi

if [ -f dist/public/_redirects ]; then
  echo "✅ تم إنشاء ملف _redirects"
  
  # Check redirects content
  if grep -q "/api/\*.*/.netlify/functions/api/:splat" dist/public/_redirects; then
    echo "✅ توجيه API موجود في ملف _redirects"
  else
    echo "❌ توجيه API غير موجود في ملف _redirects!"
    exit 1
  fi
else
  echo "❌ فشل في إنشاء ملف _redirects!"
  exit 1
fi

# 5. Check for build information
if [ -f dist/public/build-info.json ]; then
  echo "✅ تم إنشاء ملف معلومات البناء"
else
  echo "⚠️ ملف معلومات البناء غير موجود"
fi

echo -e "\n✨ تم اجتياز جميع الاختبارات بنجاح! ✨"
echo
echo "📋 خطوات النشر على Netlify:"
echo "1. قم بدفع التغييرات إلى GitHub:"
echo "   git add ."
echo "   git commit -m \"تحسين صفحة الترحيب وإصلاح مشكلة توجيه API\""
echo "   git push"
echo
echo "2. تحقق من حالة النشر على لوحة تحكم Netlify"
echo
echo "3. اختبر الروابط التالية بعد النشر:"
echo "   - صفحة الترحيب: https://your-site.netlify.app/"
echo "   - اختبار API: https://your-site.netlify.app/api/test"
echo "   - فحص صحة API: https://your-site.netlify.app/api/health"
echo

exit 0
