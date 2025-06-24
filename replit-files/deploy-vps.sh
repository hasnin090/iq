#!/bin/bash

# سكريبت نشر البرنامج على VPS
# يجب تشغيله على الخادم بعد رفع الملفات

set -e

echo "🚀 بدء عملية نشر البرنامج على VPS..."

# الألوان للرسائل
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# متغيرات الإعداد
APP_DIR="/var/www/accounting"
DB_NAME="accounting_db"
DB_USER="accounting_user"
APP_NAME="accounting-system"

# دالة لطباعة الرسائل
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# فحص صلاحيات الـ root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "يُفضل عدم تشغيل هذا السكريبت كـ root"
        read -p "هل تريد المتابعة؟ (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# تحديث النظام
update_system() {
    print_status "تحديث النظام..."
    sudo apt update && sudo apt upgrade -y
}

# تثبيت Node.js
install_nodejs() {
    print_status "تثبيت Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    
    # التحقق من التثبيت
    node_version=$(node --version)
    npm_version=$(npm --version)
    print_status "تم تثبيت Node.js $node_version و npm $npm_version"
}

# تثبيت PostgreSQL
install_postgresql() {
    print_status "تثبيت PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    
    # بدء الخدمة
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
}

# إعداد قاعدة البيانات
setup_database() {
    print_status "إعداد قاعدة البيانات..."
    
    # طلب كلمة مرور قاعدة البيانات
    read -s -p "أدخل كلمة مرور قاعدة البيانات: " DB_PASSWORD
    echo
    
    # إنشاء قاعدة البيانات والمستخدم
    sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF
    
    print_status "تم إنشاء قاعدة البيانات $DB_NAME والمستخدم $DB_USER"
}

# تثبيت PM2
install_pm2() {
    print_status "تثبيت PM2..."
    sudo npm install -g pm2
}

# تثبيت Nginx
install_nginx() {
    print_status "تثبيت Nginx..."
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
}

# إعداد التطبيق
setup_application() {
    print_status "إعداد التطبيق..."
    
    # التأكد من وجود مجلد التطبيق
    if [ ! -d "$APP_DIR" ]; then
        sudo mkdir -p $APP_DIR
        sudo chown $USER:$USER $APP_DIR
    fi
    
    cd $APP_DIR
    
    # تثبيت التبعيات
    if [ -f "package.json" ]; then
        print_status "تثبيت التبعيات..."
        npm install --production
    else
        print_error "ملف package.json غير موجود في $APP_DIR"
        exit 1
    fi
    
    # إنشاء المجلدات المطلوبة
    mkdir -p uploads backups logs
    chmod 755 uploads backups logs
}

# إنشاء ملف البيئة
create_env_file() {
    print_status "إنشاء ملف متغيرات البيئة..."
    
    if [ ! -f "$APP_DIR/.env" ]; then
        cat > $APP_DIR/.env << EOF
# قاعدة البيانات
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# الخادم
NODE_ENV=production
PORT=3000

# الأمان
SESSION_SECRET=$(openssl rand -base64 32)

# المجلدات
UPLOAD_DIR=$APP_DIR/uploads
BACKUP_DIR=$APP_DIR/backups

# السجلات
LOG_LEVEL=info
EOF
        print_status "تم إنشاء ملف .env"
    else
        print_warning "ملف .env موجود بالفعل"
    fi
}

# بناء التطبيق
build_application() {
    print_status "بناء التطبيق..."
    cd $APP_DIR
    
    if [ -f "package.json" ]; then
        npm run build
        print_status "تم بناء التطبيق"
    else
        print_error "لا يمكن بناء التطبيق - ملف package.json غير موجود"
        exit 1
    fi
}

# إنشاء جداول قاعدة البيانات
setup_database_tables() {
    print_status "إنشاء جداول قاعدة البيانات..."
    cd $APP_DIR
    npm run db:push
}

# إعداد PM2
setup_pm2() {
    print_status "إعداد PM2..."
    cd $APP_DIR
    
    # إنشاء ملف ecosystem.config.js
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'accounting-system',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF
    
    # بدء التطبيق
    pm2 start ecosystem.config.js --env production
    pm2 save
    
    # إعداد PM2 للبدء التلقائي
    pm2 startup | tail -1 | sudo bash
    
    print_status "تم إعداد PM2 وبدء التطبيق"
}

# إعداد Nginx
setup_nginx() {
    print_status "إعداد Nginx..."
    
    read -p "أدخل اسم النطاق (اتركه فارغاً للـ IP): " DOMAIN_NAME
    
    if [ -z "$DOMAIN_NAME" ]; then
        DOMAIN_NAME=$(curl -s https://ipinfo.io/ip)
        print_status "سيتم استخدام IP: $DOMAIN_NAME"
    fi
    
    # إنشاء ملف إعداد Nginx
    sudo tee /etc/nginx/sites-available/accounting << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # إعدادات الملفات الثابتة
    location /uploads/ {
        alias $APP_DIR/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # تفعيل الموقع
    sudo ln -sf /etc/nginx/sites-available/accounting /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # اختبار إعداد Nginx
    sudo nginx -t
    sudo systemctl restart nginx
    
    print_status "تم إعداد Nginx"
}

# إعداد جدار الحماية
setup_firewall() {
    print_status "إعداد جدار الحماية..."
    
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    sudo ufw --force enable
    
    print_status "تم إعداد جدار الحماية"
}

# إعداد SSL (اختياري)
setup_ssl() {
    if [ "$DOMAIN_NAME" != "$(curl -s https://ipinfo.io/ip)" ]; then
        read -p "هل تريد إعداد SSL مجاني؟ (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "تثبيت Certbot..."
            sudo apt install -y certbot python3-certbot-nginx
            
            print_status "الحصول على شهادة SSL..."
            sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
            
            print_status "تم إعداد SSL"
        fi
    fi
}

# دالة التنظيف في حالة الخطأ
cleanup() {
    print_error "حدث خطأ أثناء النشر"
    pm2 stop $APP_NAME 2>/dev/null || true
    pm2 delete $APP_NAME 2>/dev/null || true
}

# إعداد معالج الأخطاء
trap cleanup ERR

# التنفيذ الرئيسي
main() {
    print_status "بدء عملية النشر على VPS..."
    
    check_root
    update_system
    install_nodejs
    install_postgresql
    setup_database
    install_pm2
    install_nginx
    setup_application
    create_env_file
    build_application
    setup_database_tables
    setup_pm2
    setup_nginx
    setup_firewall
    setup_ssl
    
    print_status "✅ تم نشر البرنامج بنجاح!"
    print_status "🌐 يمكنك الوصول للتطبيق عبر: http://$DOMAIN_NAME"
    print_status "👤 بيانات تسجيل الدخول الافتراضية:"
    print_status "   اسم المستخدم: admin"
    print_status "   كلمة المرور: admin123"
    
    echo
    print_status "أوامر مفيدة:"
    echo "pm2 status                 # حالة التطبيق"
    echo "pm2 logs accounting-system # عرض السجلات"
    echo "pm2 restart accounting-system # إعادة تشغيل"
    echo "sudo systemctl status nginx # حالة Nginx"
}

# تشغيل الدالة الرئيسية
main "$@"