#!/bin/bash

# سكريبت النسخ الاحتياطي التلقائي للـ VPS
# يجب إضافته لـ crontab للتشغيل التلقائي

APP_DIR="/var/www/accounting"
BACKUP_DIR="$APP_DIR/backups"
DB_NAME="accounting_db"
DB_USER="accounting_user"
DATE=$(date +%Y%m%d_%H%M%S)

# إنشاء مجلد النسخ الاحتياطية إذا لم يكن موجوداً
mkdir -p $BACKUP_DIR

# النسخ الاحتياطي لقاعدة البيانات
echo "إنشاء نسخة احتياطية لقاعدة البيانات..."
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# النسخ الاحتياطي للملفات المرفوعة
echo "إنشاء نسخة احتياطية للملفات..."
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz -C $APP_DIR uploads

# النسخ الاحتياطي لإعدادات النظام
echo "نسخ ملفات الإعداد..."
cp $APP_DIR/.env $BACKUP_DIR/env_backup_$DATE
cp $APP_DIR/ecosystem.config.js $BACKUP_DIR/ecosystem_backup_$DATE.js

# حذف النسخ القديمة (الاحتفاظ بآخر 30 نسخة)
echo "تنظيف النسخ القديمة..."
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "files_backup_*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "env_backup_*" -mtime +30 -delete

echo "تم إنشاء النسخة الاحتياطية: $DATE"