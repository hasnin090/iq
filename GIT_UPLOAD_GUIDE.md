# دليل رفع النظام على GitHub

## التحضير قبل الرفع

### 1. التأكد من ملف .gitignore
تأكد من وجود هذه الملفات في .gitignore:
```
node_modules/
dist/
.env
.env.local
uploads/
backups/
cookies*.txt
*.log
.DS_Store
```

### 2. الملفات المهمة للرفع
- جميع ملفات الكود (client/, server/, shared/)
- package.json و package-lock.json
- netlify.toml
- build.cjs
- vite.config.ts
- drizzle.config.ts
- tsconfig.json
- README.md

## خطوات الرفع

### 1. إنشاء مستودع جديد على GitHub
1. اذهب إلى https://github.com/new
2. اختر اسم للمستودع (مثل: arabic-accounting-system)
3. اجعله Private إذا أردت
4. لا تضع README أو .gitignore (لأنهم موجودين بالفعل)

### 2. الأوامر في Terminal

```bash
# 1. تأكد من أنك في مجلد المشروع
cd /home/runner/workspace

# 2. ابدأ Git
git init

# 3. أضف جميع الملفات
git add .

# 4. اعمل commit
git commit -m "Initial commit - Arabic Accounting System"

# 5. اربط مع GitHub (استبدل YOUR_USERNAME باسم المستخدم)
git remote add origin https://github.com/YOUR_USERNAME/arabic-accounting-system.git

# 6. ارفع على GitHub
git branch -M main
git push -u origin main
```

## للنشر على Netlify

### 1. المتغيرات المطلوبة في Netlify
أضف هذه في Site Settings > Environment Variables:
- `DATABASE_URL` - رابط قاعدة البيانات PostgreSQL
- `SUPABASE_URL` (اختياري)
- `SUPABASE_KEY` (اختياري)
- `FIREBASE_SERVICE_ACCOUNT` (اختياري)

### 2. إعدادات البناء
- Build command: `node build.cjs`
- Publish directory: `public`

## ملاحظات مهمة

- **لا ترفع ملف .env** - احتفظ به محلياً فقط
- **المرفقات في uploads/** - لن تُرفع على Git
- **النسخ الاحتياطية** - موجودة محلياً فقط

## بعد الرفع

1. تأكد من ظهور جميع الملفات على GitHub
2. اربط Netlify بالمستودع
3. أضف المتغيرات البيئية
4. انشر الموقع

هل تريد البدء بالرفع الآن؟