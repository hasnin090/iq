#!/bin/bash

# Script to check build dependencies and prepare for Netlify deployment
echo "========== التحقق من تبعيات البناء والتحضير للنشر على Netlify =========="
echo

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js غير مثبت!"
  echo "يرجى تثبيت Node.js قبل المتابعة."
  exit 1
fi
echo "✅ Node.js مثبت: $(node -v)"

# Check for npm
if ! command -v npm &> /dev/null; then
  echo "❌ npm غير مثبت!"
  echo "يرجى تثبيت npm قبل المتابعة."
  exit 1
fi
echo "✅ npm مثبت: $(npm -v)"

# Ensure all dependencies are installed
echo "🔍 التحقق من تثبيت جميع التبعيات..."
npm install

# Check for vite specifically
if ! npx vite --version &> /dev/null; then
  echo "⚠️ تحذير: Vite غير مثبت أو غير قابل للوصول عبر npx!"
  echo "جاري تثبيت vite بشكل صريح..."
  npm install -D vite
else
  echo "✅ Vite مثبت: $(npx vite --version)"
fi

# Check for esbuild (required for Netlify functions)
if ! npx esbuild --version &> /dev/null; then
  echo "⚠️ تحذير: esbuild غير مثبت!"
  echo "جاري تثبيت esbuild..."
  npm install -D esbuild
else
  echo "✅ esbuild مثبت: $(npx esbuild --version)"
fi

# Ensure netlify directory structure exists
mkdir -p netlify/functions

# Run the deployment check
echo -e "\n🚀 تشغيل فحص النشر..."
./check-netlify-deploy.sh

echo -e "\n✨ تم الانتهاء من التحقق من التبعيات والتحضير للنشر! ✨"
