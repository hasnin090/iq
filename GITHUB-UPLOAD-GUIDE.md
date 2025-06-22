# دليل رفع المشروع على GitHub - خطوة بخطوة

## الخطوة 1: إنشاء Repository في GitHub

1. اذهب إلى [github.com](https://github.com)
2. سجل دخول أو أنشئ حساب جديد
3. اضغط على الزر الأخضر "New" أو رمز "+" في الأعلى
4. اختر "New repository"
5. املأ التفاصيل:
   - **Repository name**: `arabic-accounting-system`
   - **Description**: `نظام محاسبة متقدم باللغة العربية`
   - اختر **Public** أو **Private**
   - **لا تختر** Add README أو .gitignore أو license
6. اضغط "Create repository"

## الخطوة 2: تحضير المشروع

افتح Terminal أو Command Prompt في مجلد المشروع وشغل:

```bash
# حذف الملفات المؤقتة
rm -rf node_modules
rm -rf uploads
rm -rf backups
```

## الخطوة 3: رفع المشروع

### أ. تهيئة Git
```bash
git init
```

### ب. إضافة الملفات
```bash
git add .
```

### ج. إنشاء Commit
```bash
git commit -m "نظام محاسبة متقدم باللغة العربية"
```

### د. ربط بـ GitHub
**استبدل `yourusername` باسم المستخدم الخاص بك:**
```bash
git remote add origin https://github.com/yourusername/arabic-accounting-system.git
```

### هـ. تعيين الفرع الرئيسي
```bash
git branch -M main
```

### و. رفع المشروع
```bash
git push -u origin main
```

## إذا ظهرت مشاكل

### مشكلة: authentication failed
1. اذهب إلى GitHub Settings
2. اختر Developer settings
3. اختر Personal access tokens
4. أنشئ token جديد
5. استخدم Token بدلاً من كلمة المرور

### مشكلة: large files
```bash
# تحقق من الملفات الكبيرة
find . -size +50M -name "*.zip" -o -name "*.sql"
# احذفها أو أضفها لـ .gitignore
```

### مشكلة: repository already exists
```bash
git remote set-url origin https://github.com/yourusername/arabic-accounting-system.git
git push -u origin main
```

## بعد الرفع الناجح

1. اذهب إلى repository في GitHub
2. تأكد من وجود جميع الملفات
3. أضف وصف للمشروع
4. فعّل GitHub Pages إذا أردت (اختياري)

## ملفات مهمة في المشروع

✅ **README.md** - وصف المشروع  
✅ **LICENSE** - ترخيص المشروع  
✅ **.gitignore** - استثناء الملفات الحساسة  
✅ **package.json** - تبعيات المشروع  
✅ **.github/workflows/** - فحص تلقائي للكود  

## نصائح مهمة

- احفظ نسخة احتياطية قبل الرفع
- تأكد من عدم رفع كلمات المرور أو مفاتيح API
- راجع .gitignore للتأكد من استثناء الملفات الحساسة
- اختبر أن المشروع يعمل بعد الرفع