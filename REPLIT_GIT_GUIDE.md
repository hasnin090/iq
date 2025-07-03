# دليل رفع المشروع باستخدام Git في Replit

## الطريقة 1: استخدام واجهة Replit Git

### الخطوات:
1. **افتح شريط Tools** في Replit
2. **ابحث عن "Version Control" أو "Git"**
3. **اضغط على "Initialize Git" إذا لم يكن مُفعل**
4. **اضغط على "Connect to GitHub"**
5. **اختر "Create new repository"**

### تفاصيل Repository:
- **اسم المشروع**: `arabic-accounting-system`
- **الوصف**: `نظام محاسبة عربي متطور مع React وTypeScript`
- **الخصوصية**: اختر Public أو Private حسب رغبتك

## الطريقة 2: استخدام Shell في Replit

إذا أردت استخدام الأوامر مباشرة:

### 1. افتح Shell في Replit
### 2. نفّذ الأوامر التالية:

```bash
# إضافة جميع الملفات
git add .

# إنشاء commit
git commit -m "Initial commit: Arabic Accounting System

✅ Complete financial management system
✅ React + TypeScript frontend  
✅ Express.js + PostgreSQL backend
✅ Arabic interface with RTL support
✅ Multi-role access control
✅ Document management
✅ Automatic backups
✅ Excel export functionality"

# ربط بـ GitHub (استبدل username وrepository-name)
git remote add origin https://github.com/username/repository-name.git

# رفع الملفات
git push -u origin main
```

## إنشاء Repository على GitHub أولاً:

### 1. اذهب إلى GitHub.com
### 2. اضغط على "New repository"
### 3. املأ البيانات:
- **Repository name**: `arabic-accounting-system`
- **Description**: `نظام محاسبة عربي متطور - Advanced Arabic Accounting System`
- **اختر Public أو Private**
- **لا تضع ✅ في "Initialize with README"**

### 4. انسخ رابط Repository
سيكون شكله: `https://github.com/username/arabic-accounting-system.git`

## الطريقة 3: استخدام Replit Git Extension

إذا كانت الإضافة تظهر في الشريط الجانبي:

### 1. افتح Git panel
### 2. اضغط "Stage all changes"
### 3. اكتب commit message
### 4. اضغط "Commit"
### 5. اضغط "Push to GitHub"

## ملفات النظام المحمية (لن ترفع):

✅ **محمي تلقائياً:**
- المتغيرات البيئية (.env)
- النسخ الاحتياطية (backups/)
- الملفات المرفوعة (uploads/)
- المكتبات (node_modules/)
- ملفات البناء (dist/)

## بعد الرفع الناجح:

### المشروع سيحتوي على:
- 📁 **client/** - واجهة React
- 📁 **server/** - خادم Express.js  
- 📁 **shared/** - الملفات المشتركة
- 📁 **replit-files/** - ملفات الإعدادات
- 📄 **README.md** - معلومات المشروع
- 📄 **package.json** - التبعيات

### لاستخدام المشروع في مكان آخر:
```bash
git clone https://github.com/username/arabic-accounting-system.git
cd arabic-accounting-system
npm install
# إنشاء .env مع المتغيرات المطلوبة
npm run dev
```

---

## المتغيرات البيئية المطلوبة (.env):

```env
# قاعدة البيانات
DATABASE_URL=postgresql://username:password@host:port/database

# الجلسة
SESSION_SECRET=your-secret-key-here

# Supabase (اختياري)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key

# Firebase (اختياري)  
FIREBASE_PROJECT_ID=your-project-id
```

**النظام جاهز للرفع! اختر الطريقة الأسهل لك** 🚀