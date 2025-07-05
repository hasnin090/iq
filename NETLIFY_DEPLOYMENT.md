# نظام المحاسبة العربي - النشر على Netlify و Supabase

## 🚀 دليل النشر السريع

### المتطلبات الأساسية

1. **حساب Supabase** - [سجل مجاناً](https://supabase.com)
2. **حساب Netlify** - [سجل مجاناً](https://netlify.com)
3. **Node.js 18+** للتطوير المحلي

### خطوات النشر

#### 1. إعداد Supabase

1. أنشئ مشروع جديد في Supabase
2. انسخ URL و Anon Key من Project Settings → API
3. نفذ محتوى ملف `supabase-schema.sql` في SQL Editor
4. فعّل Row Level Security للجداول المطلوبة

#### 2. إعداد متغيرات البيئة

انسخ `.env.example` إلى `.env` وأدخل القيم الصحيحة:

```bash
cp .env.example .env
```

املأ المتغيرات التالية:
- `VITE_SUPABASE_URL`: رابط مشروعك في Supabase
- `VITE_SUPABASE_ANON_KEY`: المفتاح العام للمشروع
- `SUPABASE_SERVICE_ROLE_KEY`: مفتاح الخدمة (للوظائف الخلفية)

#### 3. النشر على Netlify

##### الطريقة الأولى: Git Integration (الأسهل)

1. ارفع الكود إلى GitHub/GitLab
2. اربط المستودع مع Netlify
3. ضع إعدادات البناء:
   - **Build Command**: `npm run build:netlify`
   - **Publish Directory**: `dist/public`
   - **Functions Directory**: `netlify/functions`

##### الطريقة الثانية: CLI

```bash
# تثبيت Netlify CLI
npm install -g netlify-cli

# تسجيل الدخول
netlify login

# بناء المشروع
npm run build:netlify

# النشر
netlify deploy --prod --dir=dist/public --functions=netlify/functions
```

#### 4. إعداد متغيرات البيئة في Netlify

في لوحة تحكم Netlify:
1. اذهب إلى Site Settings → Environment Variables
2. أضف جميع المتغيرات من ملف `.env`

### 📁 هيكل المشروع

```
├── client/              # تطبيق React
│   ├── src/
│   │   ├── components/  # مكونات واجهة المستخدم
│   │   ├── pages/       # صفحات التطبيق
│   │   ├── lib/         # إعدادات Supabase
│   │   └── hooks/       # React hooks
├── netlify/
│   └── functions/       # Netlify Functions (API)
├── shared/              # أنواع البيانات المشتركة
├── supabase-schema.sql  # مخطط قاعدة البيانات
├── netlify.toml         # إعدادات Netlify
└── vite.config.ts       # إعدادات Vite
```

### 🛠️ الأوامر المتاحة

```bash
# التطوير المحلي
npm run dev

# بناء الإنتاج
npm run build:netlify

# بناء الوظائف فقط
npm run build:functions

# فحص الأخطاء
npm run check

# معاينة البناء
npm run preview
```

### 🔧 التكوين المتقدم

#### إعداد قاعدة البيانات

1. **تشغيل Migration**:
```sql
-- في Supabase SQL Editor
\i supabase-schema.sql
```

2. **إنشاء Functions**:
```sql
-- دالة حساب ملخص دفتر الأستاذ
CREATE OR REPLACE FUNCTION get_ledger_summary()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'classified', (
            SELECT json_build_object(
                'total', COALESCE(SUM(amount), 0),
                'count', COUNT(*),
                'entries', json_agg(ledger_entries.*)
            )
            FROM ledger_entries 
            WHERE entry_type = 'classified'
        ),
        'general_expense', (
            SELECT json_build_object(
                'total', COALESCE(SUM(amount), 0),
                'count', COUNT(*),
                'entries', json_agg(ledger_entries.*)
            )
            FROM ledger_entries 
            WHERE entry_type = 'general'
        ),
        'grandTotal', (
            SELECT COALESCE(SUM(amount), 0)
            FROM ledger_entries
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
```

#### Row Level Security (RLS)

```sql
-- تفعيل RLS للجداول الحساسة
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can read own data" ON users
FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can read all data" ON users
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role = 'admin'
    )
);
```

### 🔍 استكشاف الأخطاء

#### مشاكل شائعة:

1. **خطأ في الاتصال بـ Supabase**:
   - تأكد من صحة URL و Keys
   - تحقق من إعدادات CORS في Supabase

2. **فشل في تحميل الوظائف**:
   - تأكد من وجود `netlify/functions` directory
   - تحقق من صحة build command

3. **مشاكل في التوجيه**:
   - تأكد من إعدادات redirects في `netlify.toml`
   - تحقق من proxy settings في `vite.config.ts`

#### سجلات Netlify:

```bash
# عرض سجلات الوظائف
netlify functions:log

# عرض سجلات البناء
netlify sites:list
netlify api listSiteBuildLogs --site-id YOUR_SITE_ID
```

### 📊 مراقبة الأداء

1. **Netlify Analytics**: مراقبة عدد الزيارات والأداء
2. **Supabase Dashboard**: مراقبة استخدام قاعدة البيانات
3. **Lighthouse**: فحص أداء الموقع

### 🔄 التحديثات التلقائية

مع ربط Git، سيتم تحديث الموقع تلقائياً عند:
- Push إلى الفرع الرئيسي
- Merge pull request
- تحديث إعدادات البيئة

### 🚀 التحسينات

1. **تفعيل CDN**: تلقائي مع Netlify
2. **ضغط الصور**: استخدم Netlify Image Processing
3. **التخزين المؤقت**: إعدادات Headers في `netlify.toml`
4. **PWA**: إضافة Service Worker للعمل بدون اتصال

### 📞 الدعم

- [وثائق Netlify](https://docs.netlify.com/)
- [وثائق Supabase](https://supabase.com/docs)
- [مجتمع المطورين العرب](https://discord.gg/arab-developers)

---

**ملاحظة**: هذا النظام مُصمم للاستخدام في البيئات الإنتاجية مع تطبيق أفضل ممارسات الأمان.
