# أدوات اختبار للتأكد من جاهزية النشر لـ Netlify

## 1. أداة اختبار تكوين Netlify

```bash
#!/bin/bash
echo "🔍 بدء اختبار تكوين Netlify..."

# التحقق من وجود ملف netlify.toml
if [ ! -f netlify.toml ]; then
    echo "❌ خطأ: ملف netlify.toml غير موجود!"
    exit 1
else
    echo "✅ ملف netlify.toml موجود"
fi

# التحقق من صحة تنسيق TOML
if command -v npx &> /dev/null; then
    echo "🔍 جاري التحقق من صحة تنسيق TOML..."
    npx @ltd/j-toml-cli-nodejs check netlify.toml
    if [ $? -ne 0 ]; then
        echo "❌ خطأ: ملف netlify.toml يحتوي على أخطاء تنسيق!"
        exit 1
    else
        echo "✅ تنسيق TOML صحيح"
    fi
else
    echo "⚠️ تحذير: npx غير موجود، تجاوز فحص تنسيق TOML"
fi

# التحقق من وجود مجلد Functions
if [ ! -d "netlify/functions" ]; then
    echo "❌ خطأ: مجلد netlify/functions غير موجود!"
    exit 1
else
    echo "✅ مجلد netlify/functions موجود"
fi

# التحقق من وجود دالة API
if [ ! -f "netlify/functions/api.js" ]; then
    echo "❌ خطأ: ملف netlify/functions/api.js غير موجود!"
    exit 1
else
    echo "✅ دالة API موجودة: netlify/functions/api.js"
fi

# التحقق من وجود ملف _redirects
if [ ! -f "_redirects" ]; then
    echo "❌ خطأ: ملف _redirects غير موجود!"
    exit 1
else
    echo "✅ ملف _redirects موجود"
fi

# التحقق من وجود توجيه API في ملف _redirects
if grep -q "/api/\*.*/.netlify/functions/api/:splat" _redirects; then
    echo "✅ توجيه API موجود في ملف _redirects"
else
    echo "❌ خطأ: توجيه API غير موجود في ملف _redirects!"
    exit 1
fi

echo "🎉 اختبار تكوين Netlify اكتمل بنجاح!"
```

## 2. أداة اختبار دالة API لـ Netlify

```bash
#!/bin/bash
echo "🔍 بدء اختبار دالة API لـ Netlify..."

# التحقق من وجود Node.js
if ! command -v node &> /dev/null; then
    echo "❌ خطأ: Node.js غير موجود!"
    exit 1
else
    echo "✅ Node.js موجود: $(node --version)"
fi

# إنشاء ملف اختبار مؤقت
cat > test-api.js << 'EOL'
const fs = require('fs');
const path = require('path');

// التحقق من وجود ملف API
const apiPath = path.join(__dirname, 'netlify', 'functions', 'api.js');
if (!fs.existsSync(apiPath)) {
    console.error('❌ خطأ: ملف API غير موجود!');
    process.exit(1);
}

console.log('✅ ملف API موجود');

// قراءة ملف API
try {
    const apiContent = fs.readFileSync(apiPath, 'utf8');
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
        if (typeof api.handler !== 'function') {
            console.error('❌ خطأ: handler ليس دالة!');
            process.exit(1);
        }
        console.log('✅ تم تحميل دالة API بنجاح');
        
        // اختبار تنفيذ الدالة
        console.log('🔍 اختبار تنفيذ دالة API...');
        const testEvent = {
            httpMethod: 'GET',
            path: '/.netlify/functions/api/test',
            headers: {},
            queryStringParameters: {}
        };
        
        const promise = api.handler(testEvent, {});
        if (!(promise instanceof Promise)) {
            console.error('❌ خطأ: handler لا يعيد Promise!');
            process.exit(1);
        }
        
        promise.then(result => {
            console.log('✅ تم تنفيذ دالة API بنجاح');
            console.log('📊 نتيجة الاختبار:', JSON.stringify(result, null, 2));
            
            if (result.statusCode !== 200) {
                console.warn('⚠️ تحذير: statusCode ليس 200:', result.statusCode);
            }
            
            if (!result.body) {
                console.warn('⚠️ تحذير: body فارغ!');
            }
            
            console.log('🎉 اختبار دالة API اكتمل بنجاح!');
        }).catch(error => {
            console.error('❌ خطأ في تنفيذ دالة API:', error);
            process.exit(1);
        });
    } catch (error) {
        console.error('❌ خطأ في تحميل ملف API:', error);
        process.exit(1);
    }
} catch (error) {
    console.error('❌ خطأ في قراءة ملف API:', error);
    process.exit(1);
}
EOL

# تنفيذ اختبار دالة API
echo "🔍 جاري تنفيذ اختبار دالة API..."
node test-api.js
```

## 3. أداة اختبار ملف _redirects

```bash
#!/bin/bash
echo "🔍 بدء اختبار ملف _redirects..."

# التحقق من وجود ملف _redirects
if [ ! -f "_redirects" ]; then
    echo "❌ خطأ: ملف _redirects غير موجود!"
    exit 1
else
    echo "✅ ملف _redirects موجود"
fi

# التحقق من وجود توجيه API
if grep -q "/api/\*.*/.netlify/functions/api/:splat" _redirects; then
    echo "✅ توجيه API موجود في ملف _redirects"
else
    echo "❌ خطأ: توجيه API غير موجود في ملف _redirects!"
    exit 1
fi

# التحقق من وجود توجيه SPA
if grep -q "/\*.*index.html" _redirects; then
    echo "✅ توجيه SPA موجود في ملف _redirects"
else
    echo "❌ خطأ: توجيه SPA غير موجود في ملف _redirects!"
    exit 1
fi

echo "🎉 اختبار ملف _redirects اكتمل بنجاح!"
```

## 4. أداة اختبار شاملة قبل الرفع

```bash
#!/bin/bash
echo "🚀 بدء اختبار شامل قبل الرفع..."

# اختبار تكوين Netlify
echo "------------------------------"
echo "🔍 اختبار تكوين Netlify"
echo "------------------------------"
bash ./check-netlify-config.sh
if [ $? -ne 0 ]; then
    echo "❌ فشل اختبار تكوين Netlify!"
    exit 1
fi

# اختبار دالة API
echo "------------------------------"
echo "🔍 اختبار دالة API"
echo "------------------------------"
node ./test-api.js
if [ $? -ne 0 ]; then
    echo "❌ فشل اختبار دالة API!"
    exit 1
fi

# اختبار ملف _redirects
echo "------------------------------"
echo "🔍 اختبار ملف _redirects"
echo "------------------------------"
bash ./check-redirects.sh
if [ $? -ne 0 ]; then
    echo "❌ فشل اختبار ملف _redirects!"
    exit 1
fi

# اختبار البناء
echo "------------------------------"
echo "🔍 اختبار البناء"
echo "------------------------------"
echo "⚠️ تنبيه: سيتم تنفيذ عملية البناء، قد تستغرق بعض الوقت..."
npm run build:netlify
if [ $? -ne 0 ]; then
    echo "❌ فشل اختبار البناء!"
    exit 1
else
    echo "✅ تم البناء بنجاح"
fi

# التحقق من وجود الملفات بعد البناء
echo "------------------------------"
echo "🔍 التحقق من وجود الملفات بعد البناء"
echo "------------------------------"
if [ ! -d "dist/public" ]; then
    echo "❌ خطأ: مجلد dist/public غير موجود بعد البناء!"
    exit 1
else
    echo "✅ مجلد dist/public موجود"
fi

if [ ! -f "dist/public/_redirects" ]; then
    echo "❌ خطأ: ملف dist/public/_redirects غير موجود بعد البناء!"
    exit 1
else
    echo "✅ ملف dist/public/_redirects موجود"
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "❌ خطأ: ملف dist/public/index.html غير موجود بعد البناء!"
    exit 1
else
    echo "✅ ملف dist/public/index.html موجود"
fi

echo "🎉 الاختبار الشامل اكتمل بنجاح! المشروع جاهز للرفع."
```

## كيفية استخدام أدوات الاختبار

1. **اختبار تكوين Netlify**:
   ```bash
   chmod +x check-netlify-config.sh
   ./check-netlify-config.sh
   ```

2. **اختبار دالة API**:
   ```bash
   node test-api.js
   ```

3. **اختبار ملف _redirects**:
   ```bash
   chmod +x check-redirects.sh
   ./check-redirects.sh
   ```

4. **اختبار شامل قبل الرفع**:
   ```bash
   chmod +x pre-deploy-check.sh
   ./pre-deploy-check.sh
   ```

## ملاحظات هامة

- يجب تنفيذ الاختبار الشامل قبل الرفع دائماً
- في حالة فشل أي اختبار، يجب إصلاح المشكلة قبل الرفع
- تأكد من أن ملف `netlify.toml` صحيح وخالي من أخطاء التنسيق
- تأكد من أن دالة API تعمل بشكل صحيح
- تأكد من أن ملف `_redirects` يحتوي على توجيهات صحيحة
