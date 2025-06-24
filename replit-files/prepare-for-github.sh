#!/bin/bash
# نص تحضير المشروع لرفعه على GitHub

echo "🔄 تحضير المشروع لـ GitHub..."

# حذف الملفات المؤقتة والحساسة
echo "🗑️ حذف الملفات المؤقتة..."
rm -rf node_modules/
rm -rf uploads/
rm -rf backups/
rm -rf .cache/
rm -f *.log
rm -f cookies.txt
rm -f test-*.js
rm -f test-*.mjs

# التأكد من وجود .gitignore
echo "📝 فحص .gitignore..."
if [ ! -f .gitignore ]; then
    echo "❌ ملف .gitignore غير موجود!"
    exit 1
fi

# إعادة تثبيت التبعيات
echo "📦 إعادة تثبيت التبعيات..."
npm install

# اختبار البناء
echo "🔨 اختبار بناء المشروع..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ فشل في بناء المشروع!"
    exit 1
fi

# تنظيف مخرجات البناء للرفع
rm -rf dist/

echo "✅ المشروع جاهز للرفع على GitHub!"
echo ""
echo "خطوات الرفع:"
echo "1. git init"
echo "2. git add ."
echo "3. git commit -m 'نظام محاسبة متقدم باللغة العربية'"
echo "4. git remote add origin YOUR_GITHUB_URL"
echo "5. git push -u origin main"