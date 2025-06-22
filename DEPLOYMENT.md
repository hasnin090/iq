# دليل نشر المشروع

## النشر على GitHub

### 1. تنظيف المشروع قبل الرفع

```bash
# حذف الملفات الحساسة والمؤقتة
rm -rf node_modules/
rm -rf uploads/
rm -rf backups/
rm -f cookies.txt
rm -f test-*.js test-*.mjs
```

### 2. إعداد Git

```bash
# تهيئة Git
git init

# إضافة الملفات
git add .

# أول commit
git commit -m "Initial commit: Arabic accounting system with multi-database support"

# ربط بـ GitHub
git remote add origin https://github.com/yourusername/accounting-system.git

# رفع المشروع
git push -u origin main
```

### 3. إعداد المتغيرات الحساسة

في GitHub، اذهب إلى Settings > Secrets and variables > Actions وأضف:

- `DATABASE_URL`: رابط قاعدة البيانات
- `SUPABASE_URL`: رابط Supabase
- `SUPABASE_ANON_KEY`: مفتاح Supabase العام
- `SUPABASE_SERVICE_ROLE_KEY`: مفتاح Supabase الخدمة

## النشر على منصات السحابة

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# رفع مجلد build على Netlify
```

### Railway
```bash
# إنشاء railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

### Render
```yaml
# render.yaml
services:
  - type: web
    name: accounting-system
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

## إعداد قاعدة البيانات

### Supabase
1. إنشاء مشروع جديد في supabase.com
2. الحصول على URL ومفاتيح API
3. تشغيل migration في Supabase

### PlanetScale
```sql
-- إنشاء قاعدة البيانات
CREATE DATABASE accounting_system;
```

### Neon
1. إنشاء مشروع في neon.tech
2. الحصول على connection string
3. إعداد متغيرات البيئة

## مشاكل شائعة وحلولها

### مشكلة رفع الملفات الكبيرة
```bash
# إزالة الملفات الكبيرة من Git history
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch uploads/*' --prune-empty --tag-name-filter cat -- --all
```

### مشكلة node_modules
```bash
# التأكد من وجود node_modules في .gitignore
echo "node_modules/" >> .gitignore
git rm -r --cached node_modules/
git commit -m "Remove node_modules from tracking"
```

### مشكلة الملفات الحساسة
```bash
# إزالة ملف .env من Git
git rm --cached .env
git commit -m "Remove sensitive .env file"
```

## نصائح الأمان

1. **لا تضع معلومات حساسة في الكود**
2. **استخدم متغيرات البيئة للأسرار**
3. **فعّل two-factor authentication في GitHub**
4. **راجع .gitignore قبل كل commit**

## صيانة المشروع

### تحديث التبعيات
```bash
npm audit
npm audit fix
npm update
```

### نسخ احتياطية منتظمة
```bash
# نسخ احتياطية أسبوعية
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```