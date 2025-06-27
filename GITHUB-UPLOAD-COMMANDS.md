# أوامر رفع المشروع إلى GitHub

## الخطوات المطلوبة

### 1. تحميل الملفات من مجلد dist
يمكنك تحميل الملفات من مجلد `dist` مباشرة:

```bash
# انسخ جميع الملفات من مجلد dist إلى مجلد فارغ
# ثم استخدم الأوامر التالية:

git init
git add .
git commit -m "Arabic Accounting System - Netlify Ready"
git branch -M main
git remote add origin https://github.com/hasnin090/code01.git
git push -u origin main
```

### 2. أو استخدم GitHub Desktop/Web Interface
1. اذهب إلى https://github.com/hasnin090/code01
2. اضغط "Upload files" 
3. اسحب جميع الملفات من مجلد `dist`
4. اكتب commit message: "Arabic Accounting System - Netlify Ready"
5. اضغط "Commit changes"

### 3. الملفات المطلوبة للرفع من مجلد dist:
```
├── functions/
│   ├── server.js
│   ├── server-jwt.js
│   └── server-simple.js
├── public/
│   ├── index.html
│   ├── _redirects
│   └── public/logo.svg
├── shared/
│   ├── schema.ts
│   └── tailwind.config.ts
├── README.md
├── package.json
└── netlify.toml
```

## بعد رفع الملفات إلى GitHub

### ربط مع Netlify:
1. اذهب إلى netlify.com
2. "New site from Git" → GitHub → code01
3. إعدادات:
   - **Build command:** (اتركه فارغ)
   - **Publish directory:** `public`
   - **Functions directory:** `functions`

### إضافة متغيرات البيئة:
```
DATABASE_URL=postgresql://your_neon_database_url
SESSION_SECRET=your_random_secret_32_chars_minimum
```

### تسجيل الدخول:
- المستخدم: admin
- كلمة المرور: admin123

---

**ملاحظة:** إذا كان لديك مشاكل في git push، يمكنك استخدام GitHub web interface لرفع الملفات مباشرة.