# متغيرات البيئة المطلوبة للنشر على Netlify

## في لوحة تحكم Netlify، يجب إضافة المتغيرات التالية:

### 1. متغيرات Supabase (إجبارية)
```
VITE_SUPABASE_URL=https://yieyqusnciiithjtlgod.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. متغيرات التطبيق (اختيارية)
```
VITE_APP_ENV=production
NODE_ENV=production
```

## خطوات الإعداد:

### 1. الحصول على مفاتيح Supabase:
- انتقل إلى [Supabase Dashboard](https://app.supabase.com/)
- اختر مشروعك أو أنشئ مشروع جديد
- انتقل إلى Settings > API
- انسخ:
  - Project URL (سيكون شيء مثل: https://xxxxx.supabase.co)
  - Anon public key

### 2. إعداد متغيرات البيئة في Netlify:
- انتقل إلى [Netlify Dashboard](https://app.netlify.com/)
- اختر موقعك
- انتقل إلى Site settings > Environment variables
- أضف المتغيرات التالية:

```
VITE_SUPABASE_URL = https://yieyqusnciiithjtlgod.supabase.co
VITE_SUPABASE_ANON_KEY = [مفتاح Anon من Supabase]
VITE_APP_ENV = production
NODE_ENV = production
```

### 3. إعادة النشر:
بعد إضافة المتغيرات، قم بإعادة نشر الموقع:
- انتقل إلى Deploys
- اضغط على "Trigger deploy" > "Deploy site"

## اختبار التطبيق:

### حسابات تجريبية متاحة:
```
المدير العام:
اسم المستخدم: admin
كلمة المرور: admin123

مدير المشاريع:
اسم المستخدم: manager  
كلمة المرور: manager123

مستخدم عادي:
اسم المستخدم: user
كلمة المرور: user123
```

## استكشاف الأخطاء:

### 1. إذا لم تظهر صفحة تسجيل الدخول:
- تحقق من أن المتغيرات تم إعدادها بشكل صحيح
- تحقق من logs النشر في Netlify
- تأكد من عدم وجود أخطاء JavaScript في Developer Tools

### 2. إذا فشل الاتصال بقاعدة البيانات:
- تحقق من أن VITE_SUPABASE_URL صحيح
- تحقق من أن VITE_SUPABASE_ANON_KEY صحيح
- تأكد من أن قاعدة البيانات في Supabase تعمل

### 3. أخطاء البناء:
- تحقق من logs البناء في Netlify
- تأكد من أن جميع التبعيات مثبتة بشكل صحيح

## الوضع التجريبي:
التطبيق يدعم الوضع التجريبي بدون قاعدة بيانات. سيعمل مع البيانات المحلية وحسابات تجريبية محددة مسبقاً.
