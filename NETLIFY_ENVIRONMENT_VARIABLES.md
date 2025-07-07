# متغيرات البيئة المطلوبة في Netlify
# Environment Variables Required in Netlify

## 🔑 متغيرات Supabase الأساسية
## Core Supabase Variables

# 1. رابط قاعدة البيانات
SUPABASE_DATABASE_URL=https://yieyqusnciiithjtlgod.supabase.co

# 2. مفتاح الخدمة (سري) - Service Role Key
SUPABASE_SERVICE_ROLE_KEY=<ضع المفتاح السري هنا>

# 3. المفتاح العام - Anonymous Key  
SUPABASE_ANON_KEY=<ضع المفتاح العام هنا>

# 4. مفتاح JWT السري
SUPABASE_JWT_SECRET=<ضع مفتاح JWT السري هنا>

## 🌐 متغيرات عامة (Public)
## Public Variables

# 5. رابط قاعدة البيانات العام
PUBLIC_SUPABASE_DATABASE_URL=https://yieyqusnciiithjtlgod.supabase.co

# 6. المفتاح العام
PUBLIC_SUPABASE_ANON_KEY=<ضع المفتاح العام هنا>

## 📋 خطوات الإعداد في Netlify
## Setup Steps in Netlify

### الخطوة 1: انتقل إلى إعدادات الموقع
1. في لوحة Netlify، اذهب إلى Site settings
2. اختر "Environment variables" من القائمة الجانبية

### الخطوة 2: أضف المتغيرات
لكل متغير من المتغيرات أعلاه:
1. اضغط على "Add variable"
2. أدخل الاسم (مثل: SUPABASE_DATABASE_URL)
3. أدخل القيمة 
4. اضغط "Create variable"

### الخطوة 3: إعادة النشر
بعد إضافة جميع المتغيرات، اضغط على "Trigger deploy" لإعادة النشر

## 🔒 ملاحظات أمنية
## Security Notes

⚠️ تأكد من:
- عدم مشاركة المفاتيح السرية في الكود
- استخدام المفاتيح العامة فقط للمتغيرات العامة
- حفظ المفاتيح السرية في مكان آمن

## 🚀 بعد الإعداد
## After Setup

بعد إعداد المتغيرات، سيتمكن التطبيق من:
✅ الاتصال بقاعدة بيانات Supabase
✅ المصادقة والتحقق من الهوية
✅ تنفيذ العمليات على قاعدة البيانات
✅ إدارة المستخدمين والجلسات
