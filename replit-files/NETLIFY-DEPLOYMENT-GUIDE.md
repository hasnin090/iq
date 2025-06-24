# دليل النشر على Netlify

## الخطوات المطلوبة للنشر

### 1. تحضير المشروع
تم تجهيز المشروع مع:
- ✅ ملف `netlify.toml` مع إعدادات النشر
- ✅ سكريبت البناء المخصص `build-netlify.js`
- ✅ إعدادات إعادة التوجيه للـ API
- ✅ ملف `.env.example` للمتغيرات المطلوبة

### 2. إعداد قاعدة البيانات

#### أ) Supabase (المطلوب)
1. انتقل إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. أنشئ مشروع جديد أو استخدم الموجود
3. من صفحة الإعدادات، احصل على:
   - `SUPABASE_URL`: عنوان المشروع
   - `SUPABASE_ANON_KEY`: المفتاح العام
   - `SUPABASE_SERVICE_ROLE_KEY`: مفتاح الخدمة
   - `DATABASE_URL`: رابط قاعدة البيانات من قسم "Connect"

### 3. إعداد Firebase (اختياري - للنسخ الاحتياطي)
1. انتقل إلى [Firebase Console](https://console.firebase.google.com)
2. أنشئ مشروع جديد أو استخدم الموجود
3. فعّل Authentication مع Google Sign-in
4. من إعدادات المشروع احصل على:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`

### 4. النشر على Netlify

#### الطريقة الأولى: Git Integration
1. ارفع الكود إلى GitHub Repository
2. اربط Repository بـ Netlify
3. سيتم استخدام إعدادات `netlify.toml` تلقائياً

#### الطريقة الثانية: Drag & Drop
1. قم ببناء المشروع محلياً:
   ```bash
   node build-netlify.js
   ```
2. ارفع مجلد `dist` إلى Netlify

### 5. إعداد متغيرات البيئة في Netlify

في لوحة تحكم Netlify:
1. اذهب إلى Site Settings > Environment Variables
2. أضف المتغيرات التالية:

**مطلوبة:**
```
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=production
SESSION_SECRET=generate_random_32_char_string
```

**اختيارية (للنسخ الاحتياطي):**
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

### 6. إعداد الدومين والأمان

#### SSL والأمان
- Netlify يوفر SSL تلقائياً
- تم إعداد headers الأمان في `netlify.toml`

#### Custom Domain (اختياري)
1. في Netlify: Site Settings > Domain Management
2. أضف النطاق المخصص
3. اتبع تعليمات DNS

### 7. التحقق من النشر

بعد النشر، تحقق من:
1. ✅ تحميل الصفحة الرئيسية
2. ✅ تسجيل الدخول (admin/admin123)
3. ✅ اتصال قاعدة البيانات
4. ✅ رفع الملفات
5. ✅ النسخ الاحتياطية

### 8. استيراد البيانات الموجودة

إذا كانت لديك بيانات من النسخ الاحتياطية:
1. استخدم واجهة استيراد النسخ الاحتياطية
2. أو استخدم Supabase SQL Editor لاستيراد البيانات مباشرة

### 9. المراقبة والصيانة

#### مراقبة الأداء
- استخدم Netlify Analytics
- راقب Function Logs للـ API

#### النسخ الاحتياطية
- النظام ينشئ نسخ احتياطية محلية كل 12 ساعة
- Supabase يحتفظ بنسخ احتياطية تلقائية
- Firebase يعمل كنسخ احتياطي إضافي

### 10. استكشاف الأخطاء

#### مشاكل شائعة:
1. **خطأ في الاتصال بقاعدة البيانات**
   - تحقق من DATABASE_URL
   - تأكد من صحة معلومات Supabase

2. **فشل تحميل الملفات**
   - تحقق من SUPABASE_SERVICE_ROLE_KEY
   - تأكد من تفعيل Storage في Supabase

3. **مشاكل المصادقة**
   - تحقق من SESSION_SECRET
   - تأكد من أنه مختلف عن البيئة المحلية

### الدعم
للحصول على المساعدة:
1. راجع Netlify Function Logs
2. تحقق من Browser Console للأخطاء
3. استخدم Supabase Dashboard لمراقبة قاعدة البيانات

---

**ملاحظة**: هذا النظام مصمم للعمل بكفاءة على Netlify مع حماية كاملة للبيانات المالية وأداء محسن.