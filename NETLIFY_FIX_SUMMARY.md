# إصلاح مشاكل النشر على Netlify

## 🔧 الإصلاحات المطبقة:

### 1. **تحديث إعدادات netlify.toml**
```toml
[build]
  publish = "dist/public"          # المجلد الصحيح للملفات المبنية
  command = "npm run build:netlify" # أمر البناء المحدث
  functions = "netlify/functions"   # مسار دوال Netlify
```

### 2. **إضافة cross-env للـ dependencies**
- أضيف `cross-env` إلى `package.json` لحل مشكلة متغيرات البيئة

### 3. **إصلاح دالة API TypeScript**
- تحديث `netlify/functions/api.ts` لاستخدام TypeScript بشكل صحيح
- إضافة `import { Handler } from '@netlify/functions'`
- استخدام `export const handler: Handler`

### 4. **تحسين إعدادات Vite**
```typescript
build: {
  outDir: '../dist/public',
  emptyOutDir: true,
  chunkSizeWarningLimit: 1000,
  minify: 'terser',
  sourcemap: false,
  target: 'esnext'
}
```

### 5. **تبسيط عملية البناء**
- إزالة `npm ci` من script البناء لتجنب مشاكل CI
- استخدام `vite build` مباشرة

## 🚀 النشر الآن:

بعد هذه الإصلاحات، يجب أن يعمل النشر على Netlify بنجاح:

1. ✅ **Build Command**: `npm run build:netlify`
2. ✅ **Publish Directory**: `dist/public`
3. ✅ **Functions Directory**: `netlify/functions`
4. ✅ **Node Version**: 20
5. ✅ **Environment Variables**: مُعرّفة في netlify.toml

## 📋 للمراقبة:

راقب build logs في Netlify للتأكد من:
- تثبيت dependencies بنجاح
- بناء client-side files
- بناء Netlify functions
- نشر الملفات في المجلد الصحيح

## 🔗 الروابط المتوقعة بعد النشر:

- **الموقع الرئيسي**: `https://your-site.netlify.app`
- **API Health Check**: `https://your-site.netlify.app/.netlify/functions/api/health`
- **Dashboard**: `https://your-site.netlify.app/.netlify/functions/api/dashboard`

---
*تم إصلاح جميع المشاكل المعروفة للنشر على Netlify* ✅
