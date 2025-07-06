#!/bin/bash

# Script to check Netlify deployment readiness
echo "========== فحص جاهزية النشر على Netlify =========="
echo

# Check if netlify.toml exists
if [ -f netlify.toml ]; then
  echo "✅ ملف netlify.toml موجود"
else
  echo "❌ ملف netlify.toml غير موجود!"
  exit 1
fi

# Check if _redirects exists
if [ -f _redirects ] && [ -f public/_redirects ]; then
  echo "✅ ملفات _redirects موجودة في المجلد الرئيسي ومجلد public/"
else
  echo "❌ ملفات _redirects غير كاملة!"
  if [ ! -f _redirects ]; then
    echo "   - _redirects غير موجود في المجلد الرئيسي"
  fi
  if [ ! -f public/_redirects ]; then
    echo "   - _redirects غير موجود في مجلد public/"
  fi
  exit 1
fi

# Check if Netlify Functions directory exists
if [ -d netlify/functions ]; then
  echo "✅ مجلد netlify/functions موجود"
  
  # Check for API function
  if [ -f netlify/functions/api.js ]; then
    echo "✅ دالة API (api.js) موجودة"
  else
    echo "❌ دالة API (api.js) غير موجودة!"
    exit 1
  fi
else
  echo "❌ مجلد netlify/functions غير موجود!"
  exit 1
fi

# Check if build scripts exist
if [ -f netlify-supabase-build.js ]; then
  echo "✅ سكريبت البناء netlify-supabase-build.js موجود"
else
  echo "❌ سكريبت البناء netlify-supabase-build.js غير موجود!"
  exit 1
fi

# Run pre-deploy checks if available
if [ -f pre-deploy-check.sh ]; then
  echo -e "\nتشغيل فحص ما قبل النشر..."
  bash pre-deploy-check.sh
fi

echo -e "\n========== تعليمات النشر على Netlify =========="
echo "1. تأكد من دفع جميع التغييرات إلى GitHub:"
echo "   git add ."
echo "   git commit -m \"جاهز للنشر على Netlify\""
echo "   git push"
echo
echo "2. لمتابعة النشر:"
echo "   - قم بزيارة لوحة تحكم Netlify وتحقق من حالة النشر"
echo "   - افحص سجلات البناء للتأكد من عدم وجود أخطاء"
echo "   - اختبر نقاط النهاية API بعد النشر مثل:"
echo "     * https://your-site.netlify.app/api/health"
echo "     * https://your-site.netlify.app/api/test"
echo
echo "✨ المشروع جاهز للنشر على Netlify! ✨"

exit 0