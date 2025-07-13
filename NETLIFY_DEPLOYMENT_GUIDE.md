# دليل النشر على Netlify - نظام المحاسبة العربي

## نظرة عامة
تم إصلاح جميع مشاكل النشر على Netlify. التطبيق جاهز الآن للعمل بشكل كامل على الاستضافة السحابية.

## ✅ المشاكل التي تم حلها

### 1. مشكلة عدم ظهور واجهة تسجيل الدخول
- ✅ تم إصلاح مسارات التوجيه في `netlify.toml`
- ✅ تم إعداد SPA routing بشكل صحيح
- ✅ تم إنشاء Netlify Functions للمصادقة

### 2. مشكلة الاتصال بقاعدة البيانات
- ✅ تم إنشاء API endpoints للمصادقة
- ✅ تم إعداد الوضع التجريبي (Demo Mode)
- ✅ تم إزالة التبعيات المشكلة (better-sqlite3)

### 3. مشاكل البناء
- ✅ تم إصلاح مشاكل TypeScript
- ✅ تم تحديث Vite configuration
- ✅ تم إعداد PostCSS بشكل صحيح

## 🚀 خطوات النشر

### 1. رفع الكود إلى GitHub
```bash
git add .
git commit -m "Fix Netlify deployment issues"
git push origin main
```

### 2. ربط المشروع بـ Netlify
1. انتقل إلى [Netlify Dashboard](https://app.netlify.com/)
2. اضغط على "New site from Git"
3. اختر GitHub واختر المستودع `iq`
4. استخدم الإعدادات التالية:
   - **Build command**: `npm run build:netlify`
   - **Publish directory**: `dist/public`
   - **Node version**: `20`

### 3. إعداد متغيرات البيئة
انتقل إلى Site settings > Environment variables وأضف:

```
VITE_SUPABASE_URL=https://yieyqusnciiithjtlgod.supabase.co
VITE_SUPABASE_ANON_KEY=[مفتاح Supabase Anon Key]
VITE_APP_ENV=production
NODE_ENV=production
```

**للحصول على مفاتيح Supabase:**
1. انتقل إلى [Supabase Dashboard](https://app.supabase.com/)
2. اختر مشروعك
3. انتقل إلى Settings > API
4. انسخ Project URL و Anon public key

### 4. إعادة النشر
بعد إضافة متغيرات البيئة:
1. انتقل إلى Deploys
2. اضغط على "Trigger deploy"
3. اختر "Deploy site"

## 🧪 اختبار التطبيق

### الحسابات التجريبية المتوفرة:

#### المدير العام
```
اسم المستخدم: admin
كلمة المرور: admin123
الصلاحيات: إدارة كاملة للنظام
```

#### مدير المشاريع  
```
اسم المستخدم: manager
كلمة المرور: manager123
الصلاحيات: إدارة المشاريع والتقارير
```

#### مستخدم عادي
```
اسم المستخدم: user
كلمة المرور: user123
الصلاحيات: عرض أساسي
```

## 🔧 الميزات المتوفرة

### 1. نظام المصادقة
- تسجيل دخول تجريبي بدون قاعدة بيانات
- حفظ جلسة المستخدم في localStorage
- إدارة الصلاحيات حسب نوع المستخدم

### 2. واجهة المستخدم
- تصميم عربي متجاوب
- دعم الوضع الداكن
- واجهة حديثة باستخدام Tailwind CSS

### 3. API Functions
- `/api/auth/login` - تسجيل الدخول
- `/api/auth/logout` - تسجيل الخروج  
- `/api/auth/check` - التحقق من الجلسة
- `/api/health` - فحص حالة النظام

## 🔍 استكشاف الأخطاء

### إذا لم تظهر صفحة تسجيل الدخول:
1. تحقق من Developer Tools للأخطاء
2. تأكد من أن البناء تم بنجاح
3. تحقق من Deploy logs في Netlify

### إذا فشل تسجيل الدخول:
1. تحقق من Functions logs في Netlify
2. تأكد من أن الحسابات التجريبية تعمل
3. تحقق من Network tab في Developer Tools

### إذا ظهرت أخطاء في البناء:
1. تحقق من Build logs في Netlify
2. تأكد من أن متغيرات البيئة محددة
3. تحقق من أن Node version هو 20

## 📁 هيكل المشروع

```
iq-1/
├── client/                 # تطبيق React
│   ├── src/
│   │   ├── pages/         # صفحات التطبيق
│   │   ├── components/    # مكونات UI
│   │   ├── context/       # إدارة الحالة
│   │   └── lib/          # أدوات مساعدة
│   └── index.html        # صفحة HTML الرئيسية
├── netlify/
│   └── functions/
│       └── api.js        # Netlify Functions
├── dist/public/          # ملفات البناء
├── netlify.toml          # إعدادات Netlify
└── vite.config.netlify.ts # إعدادات Vite للنشر
```

## 🌟 نصائح للتطوير المستقبلي

### 1. إضافة قاعدة بيانات حقيقية
- استكمال إعداد Supabase
- إنشاء الجداول المطلوبة
- ربط API بقاعدة البيانات

### 2. تحسين الأداء
- تقسيم الكود (Code Splitting)
- ضغط الصور
- تحسين خطوط الويب

### 3. إضافة ميزات جديدة
- نظام إدارة المستندات
- تقارير مالية متقدمة
- إشعارات فورية

## 📞 الدعم

إذا واجهت أي مشاكل أو تحتاج مساعدة:
1. تحقق من logs النشر في Netlify
2. راجع Developer Tools في المتصفح
3. تأكد من إعداد متغيرات البيئة بشكل صحيح

---

**تم إعداد هذا الدليل بتاريخ:** 13 يوليو 2025  
**حالة المشروع:** جاهز للنشر ✅
