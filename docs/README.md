# نظام المحاسبة العربي | Arabic Accounting System

<div dir="rtl">

نظام محاسبة احترافي متكامل مصمم خصيصاً للشركات والمؤسسات العربية، مع واجهة عربية بالكامل ودعم RTL.

</div>

## 🌟 المميزات

<div dir="rtl">

### 💼 إدارة مالية شاملة
- **نظام محاسبة متكامل** - إدارة الإيرادات والمصروفات بدقة
- **إدارة المشاريع** - تتبع مالي مفصل لكل مشروع
- **تقارير مالية** - تقارير شاملة وقابلة للتصدير (Excel/PDF)
- **إدارة المستحقات** - تتبع المدفوعات والمستحقات
- **مكتبة المستندات** - حفظ وربط المستندات بالمعاملات

### 🔐 الأمان والصلاحيات
- **نظام صلاحيات متقدم** - أدوار مخصصة (مدير، محاسب، مشاهد)
- **تسجيل دخول آمن** - جلسات محمية وتشفير كلمات المرور
- **سجل النشاطات** - تتبع جميع العمليات في النظام
- **نسخ احتياطي تلقائي** - كل 12 ساعة مع حفظ المرفقات

### 🚀 التقنية والأداء
- **واجهة سريعة ومتجاوبة** - React + TypeScript
- **خادم قوي** - Express.js + PostgreSQL
- **تخزين هجين** - محلي + سحابي (Supabase/Firebase)
- **دعم متعدد المنصات** - جاهز للنشر على أي منصة

</div>

## 🛠️ التثبيت السريع

```bash
# استنساخ المشروع
git clone https://github.com/YOUR_USERNAME/arabic-accounting-system.git
cd arabic-accounting-system

# تثبيت التبعيات
npm install

# إعداد البيئة
cp .env.example .env
# عدل ملف .env بمعلومات قاعدة البيانات

# تشغيل قاعدة البيانات
npm run db:push

# تشغيل التطبيق
npm run dev
```

افتح http://localhost:5000 وسجل دخول بـ:
- **المستخدم:** admin
- **كلمة المرور:** admin123

## 📦 التقنيات المستخدمة

<table>
<tr>
<td>

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Shadcn/UI
- TanStack Query

</td>
<td>

### Backend
- Express.js
- TypeScript
- Drizzle ORM
- PostgreSQL
- Express Sessions
- Bcrypt

</td>
<td>

### Cloud Services
- Neon Database
- Supabase Storage
- Firebase (Backup)
- Render/Railway

</td>
</tr>
</table>

## 🚀 النشر

### [Render](https://render.com) (موصى به)
```bash
# استخدم render.yaml الموجود
# اتبع RENDER_DEPLOYMENT_GUIDE.md
```

### Docker
```bash
docker-compose up -d
```

### Railway
```bash
railway up
```

## 📚 الوثائق

- [البدء السريع](QUICK_START.md)
- [بنية المشروع](PROJECT_STRUCTURE.md) 
- [دليل النشر](DEPLOYMENT_DOCUMENTATION.md)
- [دليل Render](RENDER_DEPLOYMENT_GUIDE.md)

## 🤝 المساهمة

<div dir="rtl">

نرحب بمساهماتكم! يرجى:

1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

</div>

## 📄 الترخيص

هذا المشروع مرخص تحت [رخصة MIT](LICENSE).

## 📞 الدعم

<div dir="rtl">

- **Issues:** قم بفتح issue على GitHub
- **Email:** support@example.com
- **Documentation:** راجع الوثائق المرفقة

</div>

---

<div align="center" dir="rtl">
صُنع بـ ❤️ لدعم الأعمال العربية
</div>