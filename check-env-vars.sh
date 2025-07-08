#!/bin/bash

echo "🔍 فحص متغيرات البيئة - Environment Variables Check"
echo "=================================================="

# التحقق من متغيرات Supabase
echo "📋 فحص متغيرات Supabase:"

# متغيرات أساسية
if [ -n "$SUPABASE_DATABASE_URL" ]; then
    echo "✅ SUPABASE_DATABASE_URL: موجود"
else
    echo "❌ SUPABASE_DATABASE_URL: غير موجود"
fi

if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "✅ SUPABASE_SERVICE_ROLE_KEY: موجود"
else
    echo "❌ SUPABASE_SERVICE_ROLE_KEY: غير موجود"
fi

if [ -n "$SUPABASE_ANON_KEY" ]; then
    echo "✅ SUPABASE_ANON_KEY: موجود"
else
    echo "❌ SUPABASE_ANON_KEY: غير موجود"
fi

if [ -n "$SUPABASE_JWT_SECRET" ]; then
    echo "✅ SUPABASE_JWT_SECRET: موجود"
else
    echo "❌ SUPABASE_JWT_SECRET: غير موجود"
fi

# متغيرات عامة
if [ -n "$PUBLIC_SUPABASE_DATABASE_URL" ]; then
    echo "✅ PUBLIC_SUPABASE_DATABASE_URL: موجود"
else
    echo "❌ PUBLIC_SUPABASE_DATABASE_URL: غير موجود"
fi

if [ -n "$PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "✅ PUBLIC_SUPABASE_ANON_KEY: موجود"
else
    echo "❌ PUBLIC_SUPABASE_ANON_KEY: غير موجود"
fi

echo ""
echo "🔧 متغيرات البناء:"
echo "NODE_VERSION: ${NODE_VERSION:-'غير محدد'}"
echo "NODE_ENV: ${NODE_ENV:-'غير محدد'}"
echo "NETLIFY: ${NETLIFY:-'غير محدد'}"

echo ""
echo "=================================================="

# حساب المتغيرات المفقودة
missing_vars=0

[ -z "$SUPABASE_DATABASE_URL" ] && ((missing_vars++))
[ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && ((missing_vars++))
[ -z "$SUPABASE_ANON_KEY" ] && ((missing_vars++))
[ -z "$SUPABASE_JWT_SECRET" ] && ((missing_vars++))
[ -z "$PUBLIC_SUPABASE_DATABASE_URL" ] && ((missing_vars++))
[ -z "$PUBLIC_SUPABASE_ANON_KEY" ] && ((missing_vars++))

if [ $missing_vars -eq 0 ]; then
    echo "🎉 جميع متغيرات البيئة موجودة!"
    echo "✅ يمكن للتطبيق الاتصال بـ Supabase"
else
    echo "⚠️ عدد المتغيرات المفقودة: $missing_vars"
    echo "❌ يجب إعداد المتغيرات المفقودة في Netlify Dashboard"
    echo ""
    echo "📋 لإعداد المتغيرات:"
    echo "1. اذهب إلى Netlify Dashboard"
    echo "2. اختر Site Settings"
    echo "3. اختر Environment Variables"
    echo "4. أضف المتغيرات المفقودة"
    echo "5. اضغط Trigger Deploy"
fi
