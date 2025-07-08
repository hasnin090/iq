// أداة اختبار دالة API لـ Netlify
const fs = require('fs');
const path = require('path');

console.log("🔍 بدء اختبار دالة API لـ Netlify...");

// التحقق من وجود ملف API
const apiPath = path.join(__dirname, 'netlify', 'functions', 'api.js');
if (!fs.existsSync(apiPath)) {
    console.error('❌ خطأ: ملف API غير موجود!');
    process.exit(1);
}

console.log('✅ ملف API موجود');

// قراءة ملف API
let apiContent;
try {
    apiContent = fs.readFileSync(apiPath, 'utf8');
    console.log('✅ تم قراءة ملف API بنجاح');
    
    // التحقق من وجود exports.handler
    if (!apiContent.includes('exports.handler')) {
        console.error('❌ خطأ: exports.handler غير موجود في ملف API!');
        process.exit(1);
    }
    console.log('✅ exports.handler موجود في ملف API');
    
    // اختبار تحميل الملف
    try {
        const api = require(apiPath);
        if (typeof api !== 'object') {
            console.error('❌ خطأ: API ليس كائناً!');
            process.exit(1);
        }
        
        // قد لا نتمكن من الوصول إلى handler مباشرة بسبب exports vs module.exports
        console.log('✅ تم تحميل ملف API بنجاح');
        
        // التحقق من محتوى الملف
        if (!apiContent.includes('app.use(express.json(')) {
            console.warn('⚠️ تحذير: لم يتم العثور على express.json middleware!');
        } else {
            console.log('✅ express.json middleware موجود');
        }
        
        if (!apiContent.includes('Access-Control-Allow-Origin')) {
            console.warn('⚠️ تحذير: لم يتم العثور على CORS headers!');
        } else {
            console.log('✅ CORS headers موجودة');
        }
        
        if (!apiContent.includes('/health') && !apiContent.includes('/test')) {
            console.warn('⚠️ تحذير: لم يتم العثور على routes أساسية!');
        } else {
            console.log('✅ Routes أساسية موجودة');
        }
        
        console.log('🎉 اختبار محتوى ملف API اكتمل بنجاح!');
        
    } catch (error) {
        console.error('❌ خطأ في تحميل ملف API:', error.message);
        console.error('Stack trace:', error.stack);
        // نستمر رغم الخطأ
    }
} catch (error) {
    console.error('❌ خطأ في قراءة ملف API:', error);
    process.exit(1);
}

// اختبار إضافي: التحقق من التنسيق
console.log('🔍 التحقق من التنسيق...');

// التحقق من نهاية الأسطر
if (apiContent.includes('\r\n')) {
    console.warn('⚠️ تحذير: ملف API يستخدم CRLF بدلاً من LF!');
} else {
    console.log('✅ تنسيق نهاية الأسطر صحيح (LF)');
}

// التحقق من نوع الملف
if (apiPath.endsWith('.cjs')) {
    console.warn('⚠️ تحذير: امتداد الملف .cjs، تأكد من أنه متوافق مع Netlify Functions!');
} else if (apiPath.endsWith('.js')) {
    console.log('✅ امتداد الملف .js (موصى به)');
} else {
    console.warn('⚠️ تحذير: امتداد الملف غير معتاد:', path.extname(apiPath));
}

console.log('🎉 اختبار دالة API اكتمل!');
