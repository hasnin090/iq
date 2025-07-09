# نظام المحاسبة العربي 📊

نظام محاسبة شامل ومتطور باللغة العربية، مصمم لإدارة المشاريع والمعاملات المالية بكفاءة عالية.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ الميزات الرئيسية

- 🎯 **إدارة المشاريع**: تتبع شامل للمشاريع وحالتها وميزانياتها
- 💰 **إدارة المعاملات**: تسجيل دقيق للإيرادات والمصروفات
- 📊 **تقارير تفصيلية**: إحصائيات ورؤى مالية متقدمة
- 👥 **إدارة المستخدمين**: نظام أذونات متقدم ومرن
- 🔒 **أمان عالي**: حماية متطورة للبيانات والمعاملات
- 📱 **تصميم متجاوب**: يعمل على جميع الأجهزة والشاشات
- 🌐 **دعم كامل للعربية**: واجهة وبيانات باللغة العربية

## 🛠️ التقنيات المستخدمة

### Frontend
- **React 18** - مكتبة واجهات المستخدم
- **TypeScript** - للتطوير الآمن والمنظم
- **Tailwind CSS** - للتصميم العصري
- **Vite** - أداة البناء السريعة
- **React Query** - لإدارة البيانات والـ API
- **React Hook Form** - لإدارة النماذج

### Backend
- **Node.js** - بيئة تشغيل الخادم
- **Express.js** - إطار عمل الخادم
- **Supabase** - قاعدة البيانات والمصادقة
- **PostgreSQL** - قاعدة البيانات الرئيسية

### DevOps & Deployment
- **Docker** - للحاوياتية
- **Netlify** - للنشر والاستضافة
- **GitHub Actions** - للتكامل المستمر

## 🚀 البدء السريع

### المتطلبات الأساسية

```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### 1. استنساخ المشروع

```bash
git clone https://github.com/your-username/accounting-system
cd accounting-system
```

### 2. تثبيت التبعيات

```bash
npm install
```

### 3. إعداد متغيرات البيئة

انسخ ملف `.env.example` إلى `.env` وقم بتعديل القيم:

```bash
cp .env.example .env
```

قم بتعديل ملف `.env` وأدخل بيانات Supabase الخاصة بك:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. إعداد قاعدة البيانات

```bash
# إنشاء الجداول والإعدادات الأساسية
npm run setup:database

# إنشاء بيانات تجريبية (اختياري)
npm run setup:sample-data
```

### 5. تشغيل المشروع

```bash
# للتطوير
npm run dev:production

# أو النسخة المبسطة
npm run dev:simple
```

سيعمل الخادم على: `http://localhost:5000`

## 📋 الأوامر المتاحة

| الأمر | الوصف |
|-------|--------|
| `npm run dev:production` | تشغيل سيرفر الإنتاج للتطوير |
| `npm run dev:simple` | تشغيل السيرفر المبسط |
| `npm run setup:database` | إعداد قاعدة البيانات |
| `npm run setup:sample-data` | إنشاء بيانات تجريبية |
| `npm run test:connection` | اختبار اتصال Supabase |
| `npm run build` | بناء المشروع للإنتاج |
| `npm run start` | تشغيل المشروع في الإنتاج |

## 🗂️ هيكل المشروع

```
📦 نظام المحاسبة العربي
├── 📁 client/                 # تطبيق العميل (Frontend)
│   ├── 📁 src/
│   │   ├── 📁 components/     # مكونات واجهة المستخدم
│   │   ├── 📁 pages/          # صفحات التطبيق
│   │   ├── 📁 hooks/          # React Hooks مخصصة
│   │   ├── 📁 lib/            # مكتبات ومساعدات
│   │   └── 📁 types/          # تعريفات TypeScript
│   └── 📁 public/             # الملفات العامة
├── 📁 server/                 # خادم التطبيق (Backend)
│   ├── 📄 production-server.js # سيرفر الإنتاج الكامل
│   ├── 📄 simple-server.js     # سيرفر مبسط للتطوير
│   └── 📁 lib/                # مكتبات الخادم
├── 📁 scripts/               # سكريبتات الإعداد والصيانة
│   ├── 📄 setup-database.js   # إعداد قاعدة البيانات
│   ├── 📄 create-sample-data.js # إنشاء بيانات تجريبية
│   └── 📄 database-setup.sql  # مخطط قاعدة البيانات
├── 📁 docs/                  # التوثيق
├── 📄 package.json           # تبعيات المشروع
├── 📄 .env.example           # مثال متغيرات البيئة
└── 📄 README.md              # هذا الملف
```

## 🔌 API المتاحة

### الأساسيات
- `GET /api/health` - فحص صحة الخادم
- `GET /api/test-supabase` - اختبار اتصال قاعدة البيانات
- `GET /api/statistics` - إحصائيات عامة

### المستخدمون
- `GET /api/users` - جلب قائمة المستخدمين
- `POST /api/users` - إنشاء مستخدم جديد
- `PUT /api/users/:id` - تحديث مستخدم
- `DELETE /api/users/:id` - حذف مستخدم

### المشاريع
- `GET /api/projects` - جلب قائمة المشاريع
- `POST /api/projects` - إنشاء مشروع جديد
- `PUT /api/projects/:id` - تحديث مشروع
- `DELETE /api/projects/:id` - حذف مشروع

### المعاملات
- `GET /api/transactions` - جلب قائمة المعاملات
- `POST /api/transactions` - إنشاء معاملة جديدة
- `PUT /api/transactions/:id` - تحديث معاملة
- `DELETE /api/transactions/:id` - حذف معاملة

## 🔧 إعداد قاعدة البيانات

### الجداول الرئيسية

- **users** - بيانات المستخدمين والأذونات
- **projects** - تفاصيل المشاريع وحالتها
- **transactions** - المعاملات المالية
- **categories** - فئات الإيرادات والمصروفات
- **attachments** - ملفات المرفقات
- **activity_logs** - سجل نشاطات المستخدمين

### الميزات الأمنية

- **Row Level Security (RLS)** - حماية على مستوى الصفوف
- **JWT Authentication** - مصادقة آمنة
- **Role-based Access** - أذونات حسب الأدوار
- **Audit Trail** - تتبع جميع العمليات

## 🚀 النشر

### Netlify (موصى به)

1. ربط المستودع بـ Netlify
2. تعيين متغيرات البيئة
3. استخدام أمر البناء: `npm run build:netlify`

### Docker

```bash
# بناء الصورة
docker build -t accounting-system .

# تشغيل الحاوية
docker run -p 5000:5000 --env-file .env accounting-system
```

## 🤝 المساهمة

نرحب بمساهماتكم! يرجى قراءة [دليل المساهمة](CONTRIBUTING.md) قبل البدء.

### خطوات المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. إنشاء Pull Request

## 📝 الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## 📞 الدعم والتواصل

- 📧 **البريد الإلكتروني**: support@accounting-system.com
- 🐛 **بلاغ خطأ**: [GitHub Issues](https://github.com/your-username/accounting-system/issues)
- 💬 **المناقشات**: [GitHub Discussions](https://github.com/your-username/accounting-system/discussions)

## 🙏 شكر وتقدير

- فريق Supabase لقاعدة البيانات الرائعة
- مجتمع React للأدوات المذهلة
- جميع المساهمين في هذا المشروع

---

<div align="center">
  <p>صُنع بـ ❤️ للمجتمع العربي</p>
  <p>© 2025 نظام المحاسبة العربي</p>
</div>
