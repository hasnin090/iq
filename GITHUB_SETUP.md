# دليل رفع المشروع على GitHub

## خطوات التحضير قبل الرفع

### 1. تنظيف المشروع
```bash
# حذف الملفات المؤقتة والحساسة
rm -rf node_modules/
rm -rf uploads/
rm -rf backups/
rm -rf .cache/
rm -f *.log
rm -f cookies.txt
rm -f test-*.js
rm -f test-*.mjs
```

### 2. التحقق من .gitignore
```bash
# التأكد من أن .gitignore يحتوي على الملفات المطلوبة
cat .gitignore
```

### 3. إعادة تثبيت التبعيات
```bash
npm install
```

## خطوات رفع المشروع

### 1. تهيئة Git
```bash
git init
git add .
git commit -m "feat: نظام محاسبة متقدم باللغة العربية مع دعم متعدد قواعد البيانات"
```

### 2. ربط المشروع بـ GitHub
```bash
# إنشاء repository في GitHub أولاً، ثم:
git remote add origin https://github.com/username/repository-name.git
git branch -M main
git push -u origin main
```

## حل المشاكل الشائعة

### مشكلة: الملفات كبيرة الحجم
```bash
# التحقق من أحجام الملفات
find . -size +50M -type f

# حذف الملفات الكبيرة من التاريخ
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch large-file.zip' --prune-empty --tag-name-filter cat -- --all
```

### مشكلة: ملفات node_modules مرفوعة
```bash
git rm -r --cached node_modules/
git commit -m "حذف node_modules من التتبع"
```

### مشكلة: ملفات حساسة مرفوعة
```bash
# حذف الملفات الحساسة
git rm --cached .env
git rm --cached uploads/*
git commit -m "حذف الملفات الحساسة"
```

### مشكلة: رفض GitHub للـ push
```bash
# في حالة وجود تضارب
git pull origin main --rebase
git push origin main

# أو إجبار الرفع (خطير - استخدم بحذر)
git push -f origin main
```

## إعداد متغيرات البيئة في GitHub

### في GitHub Repository:
1. اذهب إلى Settings
2. اختر Secrets and variables > Actions
3. أضف المتغيرات التالية:

```
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

## خطوات ما بعد الرفع

### 1. تفعيل GitHub Pages (اختياري)
```bash
# في Settings > Pages
# اختر Source: GitHub Actions
```

### 2. حماية الفرع الرئيسي
```bash
# في Settings > Branches
# أضف Branch protection rule للـ main branch
```

### 3. إعداد Webhooks (اختياري)
```bash
# لربط المشروع بخدمات النشر التلقائي
```

## أوامر Git مفيدة

### فحص حالة المشروع
```bash
git status
git log --oneline -10
```

### إدارة الفروع
```bash
git branch -a
git checkout -b feature/new-feature
```

### حل تضارب الملفات
```bash
git stash
git pull origin main
git stash pop
```

## نصائح مهمة

1. **تأكد من .gitignore**: راجع أن جميع الملفات الحساسة مستثناة
2. **اختبر البناء**: تأكد من أن `npm run build` يعمل بنجاح
3. **احفظ نسخة احتياطية**: قم بعمل نسخة احتياطية قبل الرفع
4. **اقرأ الأخطاء**: اقرأ رسائل الخطأ بعناية لفهم المشكلة

## أوامر سريعة للطوارئ

```bash
# إعادة تعيين آخر commit
git reset --soft HEAD~1

# حذف كامل وإعادة البدء
rm -rf .git
git init
git add .
git commit -m "Initial commit"

# تنظيف الذاكرة المؤقتة
git gc --aggressive --prune=now
```

## روابط مفيدة

- [GitHub Docs](https://docs.github.com/)
- [Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [.gitignore Templates](https://github.com/github/gitignore)