# 🔧 دليل حل المشاكل - النظام العربي للمحاسبة

## ✅ المشاكل التي تم حلها:

### 1. **خطأ 404 في API endpoints**
**المشكلة**: ```Failed to load resource: the server responded with a status of 404```

**الحل المطبق**:
- ✅ إضافة `/api/dashboard` للإحصائيات
- ✅ إضافة `/api/settings` للإعدادات  
- ✅ إضافة `/api/expense-types` لأنواع المصروفات
- ✅ إضافة `/api/employees` للموظفين
- ✅ إضافة `POST /api/transactions` لإنشاء المعاملات

### 2. **خطأ Supabase Auth: Invalid login credentials**
**المشكلة**: ```AuthApiError: Invalid login credentials```

**الحل المطبق**:
- ✅ إنشاء حسابات تجريبية في قاعدة البيانات
- ✅ إضافة أزرار "الملء التلقائي" في صفحة تسجيل الدخول
- ✅ إعداد ملف `supabase.js` محدث

### 3. **خطأ في جلب الموظفين والمعاملات**
**المشكلة**: ```Failed to load resource: the server responded with a status of 400```

**الحل المطبق**:
- ✅ تحديث استعلامات Supabase API
- ✅ إصلاح معالجة الأخطاء في الخادم
- ✅ إضافة بيانات تجريبية

## 🚀 الـ API Endpoints الجديدة:

```
✅ GET  /api/health          - فحص صحة الخادم
✅ GET  /api/dashboard       - إحصائيات لوحة التحكم  
✅ GET  /api/settings        - إعدادات النظام
✅ GET  /api/expense-types   - أنواع المصروفات
✅ GET  /api/employees       - قائمة الموظفين
✅ GET  /api/users           - المستخدمون
✅ GET  /api/projects        - المشاريع
✅ GET  /api/transactions    - المعاملات المالية
✅ POST /api/transactions    - إنشاء معاملة جديدة
```

## 🔐 الحسابات التجريبية:

### المدير العام:
```
البريد: admin@example.com
كلمة المرور: admin123
الصلاحيات: جميع الصلاحيات
```

### مدير المشاريع:
```
البريد: manager@example.com  
كلمة المرور: manager123
الصلاحيات: إدارة المشاريع والموظفين
```

### مستخدم عادي:
```
البريد: user@example.com
كلمة المرور: user123
الصلاحيات: عرض وإدخال بيانات محدودة
```

## 📝 خطوات الاختبار:

### 1. تشغيل الخادم:
```bash
npm run dev:simple
```
**النتيجة المتوقعة**: الخادم يعمل على `localhost:5000`

### 2. اختبار API endpoints:
```bash
# فحص الصحة
curl http://localhost:5000/api/health

# الإحصائيات  
curl http://localhost:5000/api/dashboard

# أنواع المصروفات
curl http://localhost:5000/api/expense-types
```

### 3. تسجيل الدخول:
1. انتقل إلى `http://localhost:5000`
2. اضغط على أحد الحسابات التجريبية للملء التلقائي
3. اضغط "دخول آمن"

## 🔄 إنشاء البيانات التجريبية:

### في Supabase SQL Editor:
```sql
-- 1. تشغيل ملف إنشاء المستخدمين
\i database-design/create-test-users.sql

-- 2. تشغيل ملف إنشاء البيانات
\i database-design/create-sample-data.sql
```

### أو استخدام ملفات منفصلة:
1. **انسخ محتوى** `create-test-users.sql`
2. **الصق في** Supabase SQL Editor
3. **شغل الكود**
4. **كرر** مع `create-sample-data.sql`

## ⚠️ ملاحظات مهمة:

### متغيرات البيئة:
تأكد من وجود ملف `.env` مع:
```env
SUPABASE_URL=https://jcoekbaahgjympmnuilr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://jcoekbaahgjympmnuilr.supabase.co  
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### صلاحيات Supabase:
- ✅ Row Level Security (RLS) مفعل
- ✅ سياسات الأمان محدثة
- ✅ إعدادات المصادقة صحيحة

### المنافذ:
- **الخادم**: `localhost:5000`
- **التطبيق**: `localhost:5173` (عند استخدام Vite)

## 🐛 استكشاف أخطاء إضافية:

### خطأ CORS:
```javascript
// مضاف في server/simple-server.js
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
```

### خطأ في قاعدة البيانات:
```sql
-- التحقق من الجداول
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- التحقق من المستخدمين
SELECT email FROM auth.users LIMIT 5;

-- التحقق من الملفات الشخصية  
SELECT * FROM profiles LIMIT 5;
```

## ✅ مؤشرات النجاح:

- [ ] الخادم يعمل بدون أخطاء
- [ ] جميع API endpoints تستجيب بـ 200
- [ ] تسجيل الدخول يعمل مع الحسابات التجريبية
- [ ] البيانات التجريبية ظاهرة في النظام
- [ ] لا توجد أخطاء في console المتصفح

إذا استمرت المشاكل، تحقق من:
1. **سجلات الخادم** (terminal output)
2. **سجلات المتصفح** (F12 Console)  
3. **حالة Supabase** (dashboard.supabase.co)
4. **إعدادات الشبكة** (firewall/proxy)
