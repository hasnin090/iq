# إصلاح مشكلة Firebase Storage Domain Verification

## المشكلة
```
Error 403: You must verify site or domain ownership at 
https://search.google.com/search-console/welcome?new_url_prefix=grokapp-5e120.appspot.com
```

## خطوات الإصلاح

### الخيار 1: التحقق من ملكية النطاق (الموصى به)
1. اذهب إلى [Google Search Console](https://search.google.com/search-console/welcome)
2. أضف الموقع: `grokapp-5e120.appspot.com`
3. تحقق من ملكية النطاق باستخدام إحدى الطرق:
   - ملف HTML
   - علامة HTML meta
   - Google Analytics
   - Google Tag Manager

### الخيار 2: إنشاء مشروع Firebase جديد
1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. أنشئ مشروع جديد
3. فعّل Firebase Storage
4. احصل على ملف `serviceAccountKey.json` الجديد
5. استبدل المتغيرات في البيئة

### الخيار 3: استخدام Supabase فقط (مؤقت)
```javascript
// تعطيل Firebase مؤقتاً والاعتماد على Supabase
const useFirebase = false;
```

## الحل المطبق حالياً
النظام يستخدم Supabase كمزود أساسي وFirebase كاحتياطي، لذلك المشكلة لا تؤثر على الوظائف الأساسية.