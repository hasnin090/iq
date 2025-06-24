# دليل سريع - نشر البرنامج على VPS Hostinger

## خطوات النشر (15 دقيقة):

### 1. رفع الملفات للـ VPS:
```bash
# من جهازك المحلي
scp -r ./* root@your-vps-ip:/var/www/accounting/
```

### 2. الاتصال بالـ VPS وتشغيل السكريبت:
```bash
ssh root@your-vps-ip
cd /var/www/accounting
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### 3. اتباع التعليمات التفاعلية:
- أدخل كلمة مرور قاعدة البيانات
- أدخل اسم النطاق (أو اتركه فارغاً للـ IP)
- اختر إعداد SSL (y/n)

## البيانات المطلوبة:

### بيانات VPS:
- عنوان IP للخادم
- كلمة مرور root أو SSH key
- النطاق (اختياري)

### بيانات تسجيل الدخول الافتراضية:
- اسم المستخدم: `admin`
- كلمة المرور: `admin123`

## فحص التشغيل:
```bash
# فحص حالة التطبيق
pm2 status

# فحص السجلات
pm2 logs accounting-system

# فحص قاعدة البيانات
sudo -u postgres psql -c "\l"
```

## النسخ الاحتياطية التلقائية:
```bash
# إضافة للـ crontab
crontab -e
# إضافة هذا السطر:
0 2 * * * /var/www/accounting/vps-backup-script.sh
```

## استكشاف الأخطاء:

### إذا لم يعمل التطبيق:
```bash
pm2 restart accounting-system
sudo systemctl restart nginx
```

### إذا كانت قاعدة البيانات لا تعمل:
```bash
sudo systemctl restart postgresql
npm run db:push
```

## الوصول للتطبيق:
- عبر IP: `http://your-vps-ip`
- عبر النطاق: `http://your-domain.com`
- مع SSL: `https://your-domain.com`

## إدارة التطبيق:

### إعادة تشغيل:
```bash
pm2 restart accounting-system
```

### تحديث الكود:
```bash
cd /var/www/accounting
git pull  # أو رفع ملفات جديدة
npm run build
pm2 restart accounting-system
```

### مراقبة الأداء:
```bash
pm2 monit
htop
df -h
```

## الأمان:

### تغيير كلمة مرور قاعدة البيانات:
```bash
sudo -u postgres psql
ALTER USER accounting_user PASSWORD 'new_password';
# تحديث .env بكلمة المرور الجديدة
```

### تحديث كلمة مرور المدير:
- سجل دخول للتطبيق
- اذهب للإعدادات → المستخدمين
- غير كلمة مرور المدير

المدة الإجمالية للنشر: 10-15 دقيقة