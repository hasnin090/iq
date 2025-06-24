# دليل نشر البرنامج على VPS - Hostinger

## متطلبات VPS:

### 1. المواصفات المطلوبة:
- **RAM**: 2GB كحد أدنى، 4GB مفضل
- **Storage**: 20GB كحد أدنى للنظام والتطبيق
- **CPU**: 1 Core كحد أدنى
- **OS**: Ubuntu 20.04/22.04 LTS أو CentOS 8+

### 2. البرمجيات المطلوبة:
- **Node.js**: v18 أو أحدث
- **PostgreSQL**: v13 أو أحدث
- **PM2**: لإدارة العمليات
- **Nginx**: كخادم ويب عكسي (اختياري)
- **Certbot**: لـ SSL المجاني

## خطوات التنصيب:

### 1. تحديث النظام وتثبيت المتطلبات:
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js v18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# تثبيت PM2 و Nginx
sudo npm install -g pm2
sudo apt install -y nginx

# تثبيت Git للنسخ
sudo apt install -y git
```

### 2. إعداد قاعدة البيانات:
```bash
# التبديل لمستخدم PostgreSQL
sudo -u postgres psql

# إنشاء قاعدة بيانات ومستخدم
CREATE DATABASE accounting_db;
CREATE USER accounting_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE accounting_db TO accounting_user;
\q
```

### 3. إعداد المشروع:
```bash
# إنشاء مجلد للتطبيق
sudo mkdir -p /var/www/accounting
sudo chown $USER:$USER /var/www/accounting
cd /var/www/accounting

# نسخ ملفات المشروع (أحد الطرق التالية):
# الطريقة 1: رفع ملفات من الكمبيوتر
scp -r ./project-files/* user@your-vps-ip:/var/www/accounting/

# الطريقة 2: استخدام Git (إذا كان المشروع في GitHub)
git clone https://github.com/your-repo/accounting-system.git .

# تثبيت التبعيات
npm install --production
```

### 4. إعداد متغيرات البيئة:
```bash
# إنشاء ملف .env
nano .env
```

محتوى ملف `.env`:
```env
# قاعدة البيانات
DATABASE_URL=postgresql://accounting_user:your_strong_password@localhost:5432/accounting_db

# الخادم
NODE_ENV=production
PORT=3000

# الأمان
SESSION_SECRET=your-very-long-random-secret-key-here-32-chars-minimum

# المجلدات
UPLOAD_DIR=/var/www/accounting/uploads
BACKUP_DIR=/var/www/accounting/backups

# Firebase (اختياري)
FIREBASE_API_KEY=your-key
FIREBASE_PROJECT_ID=your-project
```

### 5. إنشاء جداول قاعدة البيانات:
```bash
npm run db:push
```

### 6. إعداد PM2:
```bash
# إنشاء ملف ecosystem.config.js
nano ecosystem.config.js
```

محتوى الملف:
```javascript
module.exports = {
  apps: [{
    name: 'accounting-system',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

```bash
# بدء التطبيق
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 7. إعداد Nginx (اختياري):
```bash
# إنشاء ملف إعداد Nginx
sudo nano /etc/nginx/sites-available/accounting
```

محتوى الملف:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/accounting /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. إعداد SSL (مجاني):
```bash
# تثبيت Certbot
sudo apt install -y certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## إعدادات الأمان:

### 1. جدار الحماية:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. إعداد المجلدات:
```bash
# إنشاء مجلدات المطلوبة
mkdir -p uploads backups
chmod 755 uploads backups

# إعداد الصلاحيات
chown -R $USER:$USER /var/www/accounting
chmod -R 644 /var/www/accounting
chmod +x /var/www/accounting/dist/index.js
```

## المراقبة والصيانة:

### 1. مراقبة PM2:
```bash
# عرض حالة التطبيقات
pm2 status

# عرض السجلات
pm2 logs accounting-system

# إعادة تشغيل
pm2 restart accounting-system
```

### 2. النسخ الاحتياطية:
```bash
# النسخ الاحتياطي اليدوي لقاعدة البيانات
pg_dump -U accounting_user -h localhost accounting_db > backup_$(date +%Y%m%d).sql

# أتمتة النسخ الاحتياطية
crontab -e
# إضافة: 0 2 * * * /path/to/backup-script.sh
```

## استكشاف الأخطاء:

### أخطاء شائعة:
1. **خطأ في الاتصال بقاعدة البيانات**: فحص DATABASE_URL
2. **المنفذ مستخدم**: تغيير المنفذ في .env
3. **أخطاء الصلاحيات**: فحص صلاحيات المجلدات
4. **PM2 لا يعمل**: `pm2 delete all && pm2 start ecosystem.config.js`

### فحص الحالة:
```bash
# فحص PostgreSQL
sudo systemctl status postgresql

# فحص Nginx
sudo systemctl status nginx

# فحص PM2
pm2 status

# فحص السجلات
tail -f /var/log/nginx/error.log
pm2 logs
```

## التكلفة المتوقعة:
- **VPS أساسي**: $5-10/شهر
- **النطاق**: $10-15/سنة
- **SSL**: مجاني مع Let's Encrypt
- **إجمالي**: ~$8-12/شهر

## المزايا مقارنة بالاستضافة المشتركة:
- تحكم كامل في النظام
- أداء أفضل
- إمكانية تخصيص الإعدادات
- صلاحيات root
- مرونة في التحديثات