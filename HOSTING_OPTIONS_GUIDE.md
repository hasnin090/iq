# دليل خيارات الاستضافة لنظام المحاسبة العربي

## متطلبات النظام
- Node.js 20+
- PostgreSQL Database
- مساحة تخزين للملفات
- دعم Sessions
- HTTPS للأمان

## 1. Railway.app (الأسهل) ⭐️

### المميزات
- نشر سهل من GitHub
- PostgreSQL مجاني
- SSL تلقائي
- يدعم العربية

### خطوات النشر
1. اذهب إلى https://railway.app
2. سجل بحساب GitHub
3. اختر "New Project" > "Deploy from GitHub"
4. اختر مستودعك
5. أضف PostgreSQL من "Add Service"
6. Railway سيضيف DATABASE_URL تلقائياً

### الأسعار
- $5 شهرياً (رصيد مجاني للبداية)

## 2. Render.com ⭐️

### المميزات
- نشر تلقائي من GitHub
- PostgreSQL مجاني (محدود)
- SSL مجاني
- لوحة تحكم سهلة

### خطوات النشر
1. اذهب إلى https://render.com
2. أنشئ "Web Service" جديد
3. اربط GitHub
4. أضف PostgreSQL database
5. أضف المتغيرات البيئية

### الأسعار
- مجاني مع قيود
- $7 شهرياً للخطة المدفوعة

## 3. DigitalOcean App Platform

### المميزات
- نشر سهل
- قواعد بيانات مُدارة
- أداء ممتاز
- دعم فني جيد

### خطوات النشر
1. أنشئ App جديد
2. اربط GitHub
3. أضف Database component
4. حدد المتغيرات البيئية

### الأسعار
- $12 شهرياً (أقل خطة)

## 4. VPS (للتحكم الكامل)

### خيارات VPS
- **Contabo**: $6.99/شهر (ألمانيا، رخيص)
- **Hetzner**: €4.51/شهر (ألمانيا، موثوق)
- **DigitalOcean**: $6/شهر (عالمي)
- **Linode**: $5/شهر (عالمي)

### خطوات النشر على VPS
```bash
# 1. تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. تثبيت PostgreSQL
sudo apt install postgresql postgresql-contrib

# 3. تثبيت PM2
npm install -g pm2

# 4. استنساخ المشروع
git clone https://github.com/YOUR_REPO.git
cd YOUR_REPO

# 5. تثبيت المكتبات
npm install

# 6. إعداد قاعدة البيانات
createdb accounting_system
npm run db:push

# 7. تشغيل التطبيق
pm2 start "npm run start" --name accounting
pm2 save
pm2 startup
```

## 5. Heroku (محدود الآن)

### ملاحظة
Heroku ألغى الخطة المجانية

### الأسعار
- $5-7 شهرياً للـ Dyno
- $9 شهرياً لـ PostgreSQL

## 6. Google Cloud Run

### المميزات
- يدفع حسب الاستخدام
- يتوسع تلقائياً
- أمان عالي

### متطلبات
- Docker container
- Cloud SQL لـ PostgreSQL

## 7. استضافة عربية

### Ar-Host (السعودية)
- يدعم Node.js
- خوادم محلية
- دعم عربي

### SmarterASP.NET
- يدعم Node.js
- PostgreSQL متاح
- لوحة تحكم Plesk

## التوصيات حسب الحالة

### للمشاريع الصغيرة
**Railway أو Render** - سهل وسريع

### للشركات المتوسطة
**DigitalOcean App Platform** - موثوق ومستقر

### للتحكم الكامل
**VPS من Hetzner أو Contabo** - رخيص وقوي

### للمشاريع الكبيرة
**Google Cloud أو AWS** - قابل للتوسع

## ملفات التكوين المطلوبة

### 1. إضافة start script
```json
"scripts": {
  "start": "node dist/index.js"
}
```

### 2. متغيرات البيئة المطلوبة
```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
NODE_ENV=production
PORT=3000
```

### 3. ملف .gitignore محدث
```
node_modules/
.env
uploads/
dist/
backups/
```

## أي خيار تفضل؟ يمكنني مساعدتك في:
1. إعداد Railway (الأسهل)
2. إعداد Render 
3. إعداد VPS
4. أي خيار آخر