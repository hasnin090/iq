# دليل رفع التطبيق على Git

## خطوات رفع النظام المحاسبي العربي على Git

### الخطوة 1: تهيئة Git Repository (إذا لم يكن مُهيئاً)
```bash
git init
```

### الخطوة 2: إضافة جميع الملفات
```bash
git add .
```

### الخطوة 3: إنشاء أول commit
```bash
git commit -m "Initial commit: Arabic Accounting System

Features:
- Complete Arabic enterprise financial management system
- React frontend with TypeScript
- Express.js backend with PostgreSQL
- Supabase and Firebase integration
- Multi-role access control
- Real-time transaction processing
- Automatic backup system
- Document management
- Excel export functionality
- Mobile responsive design"
```

### الخطوة 4: ربط Repository المحلي بـ GitHub/GitLab
```bash
# استبدل YOUR_USERNAME و YOUR_REPOSITORY_NAME بالقيم الصحيحة
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
```

### الخطوة 5: رفع الملفات
```bash
git push -u origin main
```

## إذا كان لديك Repository موجود مسبقاً:

### رفع التحديثات
```bash
git add .
git commit -m "Update: Latest system improvements"
git push origin main
```

## ملاحظات مهمة:

### 1. المتغيرات البيئية
- تأكد من إنشاء `.env` file في الخادم الجديد
- لا تضع المتغيرات الحساسة في Git
- استخدم متغيرات البيئة للمعلومات التالية:
  ```
  DATABASE_URL=your_postgresql_connection_string
  SESSION_SECRET=your_session_secret
  SUPABASE_URL=your_supabase_url
  SUPABASE_ANON_KEY=your_supabase_key
  ```

### 2. الملفات المحمية
الملفات التالية محمية تلقائياً ولن يتم رفعها:
- ✅ node_modules/
- ✅ backups/
- ✅ uploads/ (الملفات المرفوعة)
- ✅ .env (المتغيرات البيئية)
- ✅ cookies*.txt (ملفات الجلسات)
- ✅ dist/ (ملفات البناء)

### 3. بعد الرفع
1. انسخ Repository إلى الخادم الجديد
2. قم بتشغيل: `npm install`
3. أنشئ `.env` file مع المتغيرات المطلوبة
4. قم بتشغيل: `npm run build` (للإنتاج)
5. قم بتشغيل: `npm start` أو `npm run dev`

### 4. هيكل النظام
```
النظام المحاسبي العربي/
├── client/          # واجهة React
├── server/          # خادم Express.js
├── shared/          # ملفات مشتركة
├── replit-files/    # ملفات إعدادات
└── scripts/         # نصوص المساعدة
```

## أوامر مفيدة:

### فحص حالة Git
```bash
git status
```

### عرض التغييرات
```bash
git diff
```

### عرض سجل Commits
```bash
git log --oneline
```

### إنشاء Branch جديد
```bash
git checkout -b feature/new-feature
```

---

**النظام جاهز للرفع! 🚀**

لأي مساعدة إضافية، راجع الملفات:
- `README.md` - معلومات عامة
- `replit.md` - تفاصيل تقنية
- `package.json` - التبعيات