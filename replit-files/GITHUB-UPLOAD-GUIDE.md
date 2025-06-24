# دليل رفع المشروع على GitHub

## خطوات إنشاء Repository جديد على GitHub

### 1. إنشاء Repository
1. اذهب إلى [GitHub](https://github.com)
2. اضغط على زر "New" أو "New repository"
3. املأ التفاصيل:
   - **Repository name**: `arabic-accounting-system`
   - **Description**: `نظام محاسبة عربي شامل - Arabic Accounting System`
   - **Visibility**: اختر Public أو Private حسب رغبتك
   - **لا تفعل** Initialize with README (لأن لدينا README جاهز)

### 2. ربط المشروع المحلي بـ GitHub

```bash
# إضافة remote origin
git remote add origin https://github.com/hasnin090/arabic-accounting-system.git

# أو إذا كنت تستخدم SSH
git remote add origin git@github.com:hasnin090/arabic-accounting-system.git
```

### 3. رفع الملفات

```bash
# إضافة جميع الملفات
git add .

# إنشاء commit أول
git commit -m "Initial commit: Arabic Accounting System

- Complete accounting system with Arabic support
- User management with role-based permissions  
- Project management and financial tracking
- File attachments and cloud storage integration
- Automatic backup system
- Built with React, Node.js, TypeScript, PostgreSQL"

# رفع إلى GitHub
git push -u origin main
```

## نصائح مهمة

### قبل الرفع
- تأكد من وجود ملف `.gitignore` لتجنب رفع ملفات غير ضرورية
- احذف أي بيانات حساسة أو كلمات مرور من الكود
- راجع ملف `README.md` وتأكد من صحة المعلومات

### بعد الرفع
- اضبط settings المشروع على GitHub
- أضف توضيحات في Issues إذا لزم الأمر
- أنشئ Releases للإصدارات المختلفة

### حماية البيانات الحساسة
- لا ترفع ملف `.env` أبداً
- استخدم GitHub Secrets للبيانات الحساسة في الإنتاج
- راجع history قبل الرفع للتأكد من عدم وجود كلمات مرور

## أوامر Git مفيدة

```bash
# فحص حالة المشروع
git status

# رؤية التغييرات
git diff

# إضافة ملفات محددة
git add file1.js file2.js

# إضافة جميع الملفات المعدلة
git add -A

# إنشاء commit
git commit -m "وصف التغيير"

# رفع التغييرات
git push

# جلب آخر التحديثات
git pull

# إنشاء branch جديد
git checkout -b feature-name

# التبديل بين branches
git checkout main
git checkout feature-name

# دمج branch
git checkout main
git merge feature-name
```

## نصائح للـ Commits

### أسماء Commits جيدة
```bash
git commit -m "Add: user authentication system"
git commit -m "Fix: transaction deletion permission check"
git commit -m "Update: database schema for employees"
git commit -m "Refactor: file upload handling"
```

### تجنب هذه الأسماء
```bash
git commit -m "fix"
git commit -m "update"
git commit -m "changes"
```

## إعداد GitHub Pages (اختياري)
إذا كنت تريد نشر التطبيق على GitHub Pages:

1. اذهب إلى Settings في المشروع
2. اختر Pages من القائمة الجانبية
3. اختر Source: Deploy from a branch
4. اختر Branch: main و Folder: /docs أو /root

## استنساخ المشروع لاحقاً

```bash
# استنساخ المشروع
git clone https://github.com/hasnin090/arabic-accounting-system.git

# الدخول إلى مجلد المشروع
cd arabic-accounting-system

# تثبيت التبعيات
npm install

# إنشاء ملف البيئة
cp .env.example .env

# تحديث متغيرات البيئة في .env
# ثم تشغيل التطبيق
npm run dev
```

## حل المشاكل الشائعة

### مشكلة Permission denied
```bash
# إذا كانت المشكلة في SSH
ssh-keygen -t rsa -b 4096 -C "fcblon@yahoo.com"
# ثم أضف المفتاح العام إلى GitHub Settings > SSH Keys
```

### مشكلة remote origin already exists
```bash
git remote remove origin
git remote add origin https://github.com/hasnin090/arabic-accounting-system.git
```

### مشكلة merge conflicts
```bash
git status  # رؤية الملفات المتضاربة
# عدل الملفات يدوياً لحل التضارب
git add .
git commit -m "Resolve merge conflicts"
```