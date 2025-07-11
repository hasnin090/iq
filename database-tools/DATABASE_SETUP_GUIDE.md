# 📋 دليل إعداد قاعدة البيانات للنظام المحاسبي

## 🎯 الوضع الحالي
- ✅ **الاتصال مع Supabase:** يعمل بشكل صحيح
- ✅ **الجداول الأساسية:** موجودة (5/11)
- ❌ **الجداول المطلوبة:** ناقصة (6 جداول)

## 📊 الجداول الموجودة حالياً:
1. ✅ `users` - المستخدمون (4 سجلات)
2. ✅ `projects` - المشاريع (فارغ)
3. ✅ `transactions` - المعاملات (فارغ)
4. ✅ `documents` - المستندات (فارغ)
5. ✅ `settings` - الإعدادات (4 سجلات)

## 🚀 الجداول المطلوب إنشاؤها:
1. ❌ `categories` - فئات المعاملات
2. ❌ `accounts` - الحسابات المحاسبية
3. ❌ `invoices` - الفواتير
4. ❌ `invoice_items` - بنود الفواتير
5. ❌ `payments` - المدفوعات
6. ❌ `contacts` - جهات الاتصال

## 📝 خطوات الإعداد:

### الخطوة 1: تسجيل الدخول إلى Supabase
1. اذهب إلى: https://supabase.com/dashboard
2. افتح مشروع: `jcoekbaahgjympmnuilr`

### الخطوة 2: تنفيذ SQL لإنشاء الجداول
1. في لوحة التحكم، اذهب إلى **SQL Editor**
2. انسخ محتوى ملف [`database-setup.sql`](./database-setup.sql)
3. الصق الكود في SQL Editor
4. اضغط **Run** لتنفيذ الأوامر

### الخطوة 3: إدراج البيانات التجريبية (اختياري)
1. في SQL Editor، انسخ محتوى ملف [`sample-data.sql`](./sample-data.sql)
2. الصق الكود وانقر **Run**
3. هذا سيضيف بيانات تجريبية للاختبار

### الخطوة 4: التحقق من الإعداد
```bash
node final-database-check.js
```

## 🔧 ما يتضمنه الإعداد:

### 📊 جداول النظام:
- **categories**: تصنيف المعاملات (إيرادات، مصروفات، أصول، التزامات)
- **accounts**: الحسابات المحاسبية (النقدية، البنك، الحسابات المدينة، إلخ)
- **contacts**: العملاء، الموردين، الموظفين
- **invoices**: فواتير المبيعات والمشتريات
- **invoice_items**: بنود الفواتير التفصيلية
- **payments**: المقبوضات والمدفوعات

### 🔐 الأمان:
- Row Level Security (RLS) مُفعل على جميع الجداول
- سياسات وصول للمستخدمين المسجلين
- Triggers لتحديث `updated_at` تلقائياً

### 📈 الفهارس:
- فهارس لتحسين الأداء على الحقول المهمة
- فهارس على أرقام الفواتير والمدفوعات
- فهارس على التواريخ والحالات

### 🏗️ البيانات الأساسية:
- فئات أساسية للمعاملات
- حسابات محاسبية أساسية
- إعدادات النظام الافتراضية

## 🧪 البيانات التجريبية تتضمن:
- 7 فئات للمعاملات
- 13 حساب محاسبي
- 5 جهات اتصال
- 3 فواتير مع بنودها
- 3 مدفوعات
- 5 معاملات محاسبية
- 12 إعداد للنظام

## ✅ التحقق من نجاح الإعداد:
بعد تنفيذ SQL، يجب أن تحصل على:
- ✅ 11/11 جدول موجود
- ✅ 100% نسبة إكمال
- ✅ بيانات تجريبية للاختبار

## 🎯 النتيجة المتوقعة:
```
📊 الجداول الموجودة: 11/11
📈 نسبة الإكمال: 100%
🎉 قاعدة البيانات مكتملة ومهيأة للاستخدام!
```

## 🔧 ملفات الاختبار المتاحة:
- `supabase-test.js` - اختبار الاتصال الأساسي
- `client-config-test.js` - اختبار إعدادات العميل
- `final-database-check.js` - فحص شامل لقاعدة البيانات
- `check-tables.js` - فحص سريع للجداول

## 📞 في حالة المساعدة:
إذا واجهت أي مشاكل، تأكد من:
1. صحة مفاتيح Supabase
2. صلاحيات المستخدم في Supabase
3. تفعيل RLS بشكل صحيح
4. تنفيذ جميع أوامر SQL بدون أخطاء
