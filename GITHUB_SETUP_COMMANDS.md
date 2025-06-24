# أوامر رفع المشروع على GitHub

## خطوات سريعة للرفع

### 1. إنشاء Repository على GitHub
- اذهب إلى github.com
- اضغط "New Repository"
- اسم المشروع: `arabic-accounting-system`
- الوصف: `نظام محاسبة عربي شامل`
- اتركه بدون README (لدينا جاهز)

### 2. أوامر Git للرفع

```bash
# إضافة جميع الملفات للمرحلة
git add .

# إنشاء أول commit
git commit -m "Initial commit: Arabic Accounting System

Features:
- Complete accounting system with Arabic support
- User management with role-based permissions
- Project management and financial tracking  
- File attachments and cloud storage integration
- Automatic backup system
- Payroll management with partial payments
- Multi-provider cloud storage (Supabase, Firebase)
- Built with React, Node.js, TypeScript, PostgreSQL"

# ربط المشروع بـ GitHub (استبدل your-username باسم المستخدم الخاص بك)
git remote add origin https://github.com/your-username/arabic-accounting-system.git

# رفع الملفات
git push -u origin main
```

### 3. فحص ما قبل الرفع
✅ ملف `.gitignore` موجود - يمنع رفع ملفات غير ضرورية
✅ ملف `README.md` شامل ومفصل
✅ ملف `.env.example` يوضح المتغيرات المطلوبة  
✅ ملف `LICENSE` للترخيص
✅ معلومات المشروع محدثة في `package.json`
✅ التوثيق الكامل في مجلد `replit-files/`

## بعد الرفع

1. **اضبط إعدادات المشروع**:
   - اذهب إلى Settings في المشروع
   - أضف وصف مفصل
   - أضف topics/tags للمشروع

2. **حماية البيانات**:
   - تأكد من عدم وجود كلمات مرور في الكود
   - استخدم GitHub Secrets للبيانات الحساسة

3. **التوثيق**:
   - أضف Issues للميزات المستقبلية
   - أنشئ Wiki إذا لزم الأمر

## نصائح إضافية

- استبدل `your-username` باسم المستخدم الفعلي
- يمكنك جعل المشروع Private أو Public حسب رغبتك
- راجع الملفات قبل الرفع للتأكد من عدم وجود بيانات حساسة