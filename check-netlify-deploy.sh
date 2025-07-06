#!/bin/bash

# Script to check Netlify deployment readiness
echo "========== فحص جاهزية النشر على Netlify =========="
echo

# Check if netlify.toml exists and has correct content
if [ -f netlify.toml ]; then
  echo "✅ ملف netlify.toml موجود"
  
  # Check for required sections in netlify.toml
  if grep -q "\[build\]" netlify.toml && grep -q "functions = \"netlify/functions\"" netlify.toml; then
    echo "✅ قسم [build] وإعدادات functions موجودة في netlify.toml"
  else
    echo "❌ قسم [build] أو إعدادات functions غير موجودة في netlify.toml!"
    exit 1
  fi
  
  # Check for redirects in netlify.toml
  if grep -q "/api/\*.*/.netlify/functions/api/:splat" netlify.toml; then
    echo "✅ توجيه API موجود في ملف netlify.toml"
  else
    echo "⚠️ تحذير: توجيه API قد يكون غير موجود في netlify.toml"
    echo "تأكد من وجود قسم [[redirects]] مع from = \"/api/*\" و to = \"/.netlify/functions/api/:splat\""
  fi
else
  echo "❌ ملف netlify.toml غير موجود!"
  exit 1
fi

# Check if _redirects exists and has correct content
if [ -f _redirects ] && [ -f public/_redirects ]; then
  echo "✅ ملفات _redirects موجودة في المجلد الرئيسي ومجلد public/"
  
  # Check content of _redirects
  if grep -q "/api/\*.*/.netlify/functions/api/:splat" _redirects; then
    echo "✅ توجيه API موجود في ملف _redirects"
  else
    echo "❌ توجيه API غير موجود في ملف _redirects!"
    echo "يجب أن يحتوي الملف على سطر مشابه لـ:"
    echo "/api/*  /.netlify/functions/api/:splat  200"
    exit 1
  fi
  
  # Check if both _redirects files have the same content
  if cmp -s _redirects public/_redirects; then
    echo "✅ محتوى ملفات _redirects متطابق"
  else
    echo "❌ محتوى ملفات _redirects غير متطابق!"
    echo "يجب أن يكون محتوى الملفين متطابقاً."
    exit 1
  fi
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
    
    # Check API function content
    if grep -q "exports.handler" netlify/functions/api.js; then
      echo "✅ دالة API تحتوي على exports.handler"
    else
      echo "❌ دالة API لا تحتوي على exports.handler!"
      echo "يجب أن تحتوي دالة API على exports.handler للعمل مع Netlify Functions"
      exit 1
    fi
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

# Check dist structure after build
echo -e "\n🔍 التحقق من هيكل المجلدات بعد البناء..."
if [ -d dist ]; then
  echo "✅ مجلد dist موجود"
  if [ -d dist/public ]; then
    echo "✅ مجلد dist/public موجود"
    
    # Check for _redirects in dist/public
    if [ -f dist/public/_redirects ]; then
      echo "✅ ملف _redirects موجود في dist/public"
      
      # Check content of _redirects in dist/public
      if grep -q "/api/\*.*/.netlify/functions/api/:splat" dist/public/_redirects; then
        echo "✅ توجيه API موجود في ملف dist/public/_redirects"
      else
        echo "❌ توجيه API غير موجود في ملف dist/public/_redirects!"
        echo "هذا قد يسبب مشكلة 404 لطلبات API"
      fi
    else
      echo "⚠️ ملف _redirects غير موجود في dist/public"
      echo "هذا قد يسبب مشكلة 404 لطلبات API والمسارات الأخرى"
    fi
  else
    echo "⚠️ مجلد dist/public غير موجود - سيتم إنشاؤه أثناء البناء"
  fi
else
  echo "⚠️ مجلد dist غير موجود - سيتم إنشاؤه أثناء البناء"
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