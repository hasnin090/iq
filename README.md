# نظام المحاسبة العربي - شركة طريق العامرة

نظام محاسبة متكامل مبني بتقنيات الويب الحديثة لإدارة المشاريع والمعاملات المالية والموظفين.

## 🚀 المزايا

- **إدارة المشاريع**: تتبع المشاريع والميزانيات
- **المعاملات المالية**: إدارة شاملة للمدفوعات والمقبوضات
- **إدارة الموظفين**: تسجيل وإدارة بيانات الموظفين
- **التقارير**: تقارير مفصلة وتحليلات مالية
- **واجهة عربية**: دعم كامل للغة العربية من اليمين إلى اليسار

## 🛠️ التقنيات المستخدمة

### الواجهة الأمامية
- **React** - مكتبة JavaScript لبناء واجهات المستخدم
- **Vite** - أداة بناء سريعة ومطورة
- **Tailwind CSS** - إطار عمل CSS للتصميم
- **Radix UI** - مكونات واجهة مستخدم متقدمة

### الواجهة الخلفية
- **Node.js** - بيئة تشغيل JavaScript
- **Express** - إطار عمل خادم الويب
- **Netlify Functions** - خدمات خالية من الخادم

### قاعدة البيانات
- **Supabase** - منصة قاعدة بيانات PostgreSQL
- **Drizzle ORM** - أداة تعامل مع قاعدة البيانات

## 📁 هيكل المشروع

```
├── client/                 # الواجهة الأمامية (React)
├── server/                 # الواجهة الخلفية (Express)
├── netlify/functions/      # دوال Netlify
├── database-design/        # تصميم قاعدة البيانات
├── database-tools/         # أدوات قاعدة البيانات
├── scripts/               # سكريبتات الإعداد والتهيئة
├── public/                # الملفات العامة
├── shared/                # الكود المشترك
└── docs/                  # التوثيق
```

## ⚙️ الإعداد والتشغيل

### متطلبات النظام
- Node.js 18+ 
- npm 9+

### التثبيت
```bash
npm install
```

### إعداد متغيرات البيئة
انسخ ملف `.env.example` إلى `.env` وقم بتعبئة القيم المطلوبة:
```bash
cp .env.example .env
```

### تشغيل المشروع

#### التطوير المحلي
```bash
# تشغيل الواجهة الأمامية
npm run dev:client

# تشغيل الواجهة الخلفية
npm run dev

# تشغيل النظام المتكامل
npm run dev:fullstack
```

#### الإنتاج
```bash
# بناء المشروع
npm run build

# تشغيل الخادم
npm start
```

### إعداد قاعدة البيانات
```bash
# إنشاء الجداول
npm run setup:database

# إضافة بيانات تجريبية
npm run setup:sample-data
```

## 🚀 النشر

المشروع مُعد للنشر على منصة Netlify:

1. ربط المستودع مع Netlify
2. تعيين متغيرات البيئة في لوحة تحكم Netlify
3. النشر التلقائي عند كل تحديث

## 📝 الترخيص

MIT License

## 🤝 المساهمة

نرحب بالمساهمات! يرجى إنشاء Pull Request أو فتح Issue لاقتراح التحسينات.

---

**شركة طريق العامرة** - نظام محاسبة متطور وموثوق
