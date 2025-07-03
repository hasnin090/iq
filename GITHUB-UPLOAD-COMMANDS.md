# أوامر رفع النظام على GitHub

## حل مشكلة Git Lock أولاً
```bash
rm -f .git/index.lock
```

## التحقق من الحالة الحالية
```bash
git status
```

## إضافة الملفات الجديدة والمحدثة
```bash
git add build.cjs netlify.toml GIT_UPLOAD_GUIDE.md NETLIFY-FIX-GUIDE.md replit.md
```

## عمل Commit للتغييرات
```bash
git commit -m "Fix Netlify deployment and update documentation"
```

## رفع التغييرات إلى GitHub
```bash
git push
```

## إذا لم يكن لديك remote مضاف:
```bash
# تحقق من الـ remotes الموجودة
git remote -v

# إذا لم يكن هناك origin، أضفه:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# ثم ارفع:
git push -u origin main
```

## الملفات المهمة التي ستُرفع:
- ✅ build.cjs - سكريبت بناء Netlify
- ✅ netlify.toml - إعدادات Netlify
- ✅ جميع ملفات النظام (client/, server/, shared/)
- ✅ package.json و package-lock.json
- ✅ الوثائق والأدلة

## الملفات التي لن تُرفع (بسبب .gitignore):
- ❌ node_modules/
- ❌ .env
- ❌ uploads/ (المرفقات)
- ❌ backups/ (النسخ الاحتياطية)
- ❌ dist/ (ملفات البناء)

انسخ هذه الأوامر واحدة تلو الأخرى في Terminal!