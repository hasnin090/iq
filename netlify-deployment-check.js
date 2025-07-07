#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 فحص نهائي للاستعداد للنشر على Netlify...');
console.log('='.repeat(60));

const publicDir = path.join(__dirname, 'dist', 'public');
const checks = [];

// فحص ملف app.html
console.log('\n📱 فحص app.html...');
const appHtmlPath = path.join(publicDir, 'app.html');
if (fs.existsSync(appHtmlPath)) {
  const appContent = fs.readFileSync(appHtmlPath, 'utf8');
  const hasScript = appContent.includes('<script type="module"') && appContent.includes('index-');
  const hasRoot = appContent.includes('<div id="root">');
  const hasMetaTags = appContent.includes('meta name="description"');
  
  checks.push({
    name: 'app.html يحتوي على script tag',
    status: hasScript,
    details: hasScript ? '✅ موجود' : '❌ مفقود'
  });
  
  checks.push({
    name: 'app.html يحتوي على root div',
    status: hasRoot,
    details: hasRoot ? '✅ موجود' : '❌ مفقود'
  });
  
  checks.push({
    name: 'app.html يحتوي على meta tags',
    status: hasMetaTags,
    details: hasMetaTags ? '✅ موجود' : '❌ مفقود'
  });
} else {
  checks.push({
    name: 'app.html موجود',
    status: false,
    details: '❌ الملف غير موجود'
  });
}

// فحص ملف index.html (صفحة الترحيب)
console.log('\n🏠 فحص index.html...');
const indexHtmlPath = path.join(publicDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
  const isWelcomePage = indexContent.includes('صفحة الترحيب') || indexContent.includes('الذهاب إلى التطبيق') || indexContent.includes('نظام المحاسبة العربي');
  
  checks.push({
    name: 'index.html صفحة ترحيب',
    status: isWelcomePage,
    details: isWelcomePage ? '✅ صفحة ترحيب احترافية' : '❌ ليست صفحة ترحيب'
  });
} else {
  checks.push({
    name: 'index.html موجود',
    status: false,
    details: '❌ الملف غير موجود'
  });
}

// فحص ملف _redirects
console.log('\n🔄 فحص _redirects...');
const redirectsPath = path.join(publicDir, '_redirects');
if (fs.existsSync(redirectsPath)) {
  const redirectsContent = fs.readFileSync(redirectsPath, 'utf8');
  const hasApiRedirects = redirectsContent.includes('/api/*');
  const hasAppRedirects = redirectsContent.includes('/app') && redirectsContent.includes('app.html');
  const hasFallback = redirectsContent.includes('/*') && redirectsContent.includes('index.html');
  
  checks.push({
    name: '_redirects يحتوي على توجيه API',
    status: hasApiRedirects,
    details: hasApiRedirects ? '✅ موجود' : '❌ مفقود'
  });
  
  checks.push({
    name: '_redirects يحتوي على توجيه التطبيق',
    status: hasAppRedirects,
    details: hasAppRedirects ? '✅ موجود' : '❌ مفقود'
  });
  
  checks.push({
    name: '_redirects يحتوي على fallback',
    status: hasFallback,
    details: hasFallback ? '✅ موجود' : '❌ مفقود'
  });
} else {
  checks.push({
    name: '_redirects موجود',
    status: false,
    details: '❌ الملف غير موجود'
  });
}

// فحص مجلد assets
console.log('\n📁 فحص مجلد assets...');
const assetsDir = path.join(publicDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const assetFiles = fs.readdirSync(assetsDir);
  const hasJsFiles = assetFiles.some(file => file.endsWith('.js'));
  const hasCssFiles = assetFiles.some(file => file.endsWith('.css'));
  const hasMainJs = assetFiles.some(file => file.startsWith('index-') && file.endsWith('.js'));
  
  checks.push({
    name: 'assets يحتوي على ملفات JS',
    status: hasJsFiles,
    details: hasJsFiles ? `✅ ${assetFiles.filter(f => f.endsWith('.js')).length} ملف` : '❌ لا توجد ملفات JS'
  });
  
  checks.push({
    name: 'assets يحتوي على ملفات CSS',
    status: hasCssFiles,
    details: hasCssFiles ? `✅ ${assetFiles.filter(f => f.endsWith('.css')).length} ملف` : '❌ لا توجد ملفات CSS'
  });
  
  checks.push({
    name: 'assets يحتوي على main JS',
    status: hasMainJs,
    details: hasMainJs ? '✅ موجود' : '❌ مفقود'
  });
} else {
  checks.push({
    name: 'assets موجود',
    status: false,
    details: '❌ المجلد غير موجود'
  });
}

// فحص دوال Netlify
console.log('\n⚡ فحص دوال Netlify...');
const functionsDir = path.join(__dirname, 'netlify', 'functions');
if (fs.existsSync(functionsDir)) {
  const functionFiles = fs.readdirSync(functionsDir);
  const hasApiFunction = functionFiles.includes('api.js') || functionFiles.includes('api-production.js');
  
  checks.push({
    name: 'دالة API موجودة',
    status: hasApiFunction,
    details: hasApiFunction ? '✅ موجودة' : '❌ مفقودة'
  });
  
  if (hasApiFunction) {
    const apiPath = fs.existsSync(path.join(functionsDir, 'api.js')) 
      ? path.join(functionsDir, 'api.js')
      : path.join(functionsDir, 'api-production.js');
    
    const apiContent = fs.readFileSync(apiPath, 'utf8');
    const hasEndpoints = apiContent.includes('/health') && apiContent.includes('/test');
    
    checks.push({
      name: 'دالة API تحتوي على endpoints',
      status: hasEndpoints,
      details: hasEndpoints ? '✅ موجودة' : '❌ مفقودة'
    });
  }
} else {
  checks.push({
    name: 'مجلد functions موجود',
    status: false,
    details: '❌ المجلد غير موجود'
  });
}

// فحص ملف netlify.toml
console.log('\n⚙️ فحص netlify.toml...');
const netlifyTomlPath = path.join(__dirname, 'netlify.toml');
if (fs.existsSync(netlifyTomlPath)) {
  const netlifyContent = fs.readFileSync(netlifyTomlPath, 'utf8');
  const hasCorrectPublish = netlifyContent.includes('publish = "dist/public"');
  const hasCorrectFunctions = netlifyContent.includes('functions = "netlify/functions"');
  const hasRedirects = netlifyContent.includes('[[redirects]]');
  
  checks.push({
    name: 'netlify.toml publish صحيح',
    status: hasCorrectPublish,
    details: hasCorrectPublish ? '✅ dist/public' : '❌ خطأ في المسار'
  });
  
  checks.push({
    name: 'netlify.toml functions صحيح',
    status: hasCorrectFunctions,
    details: hasCorrectFunctions ? '✅ netlify/functions' : '❌ خطأ في المسار'
  });
  
  checks.push({
    name: 'netlify.toml يحتوي على redirects',
    status: hasRedirects,
    details: hasRedirects ? '✅ موجود' : '❌ مفقود'
  });
} else {
  checks.push({
    name: 'netlify.toml موجود',
    status: false,
    details: '❌ الملف غير موجود'
  });
}

// طباعة النتائج
console.log('\n📊 نتائج الفحص النهائي:');
console.log('='.repeat(60));

let passedChecks = 0;
let totalChecks = checks.length;

checks.forEach((check, index) => {
  const status = check.status ? '✅' : '❌';
  const number = (index + 1).toString().padStart(2, '0');
  console.log(`${number}. ${status} ${check.name}`);
  console.log(`    ${check.details}`);
  
  if (check.status) passedChecks++;
});

console.log('\n' + '='.repeat(60));
console.log(`📈 النتيجة النهائية: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 ممتاز! التطبيق جاهز للنشر على Netlify');
  console.log('🚀 يمكنك الآن رفع الملفات أو ربط المستودع بـ Netlify');
  console.log('\n📝 خطوات النشر:');
  console.log('1. ادفع الكود إلى GitHub');
  console.log('2. اربط المستودع بـ Netlify');
  console.log('3. اتركق إعدادات البناء تلقائية (ستستخدم netlify.toml)');
  console.log('4. انشر!');
  
  console.log('\n🔗 روابط التطبيق بعد النشر:');
  console.log('• الصفحة الرئيسية: https://your-app.netlify.app');
  console.log('• التطبيق المباشر: https://your-app.netlify.app/app');
  console.log('• لوحة التحكم: https://your-app.netlify.app/dashboard');
  console.log('• API Health: https://your-app.netlify.app/api/health');
  
} else {
  console.log('\n⚠️ يوجد مشاكل تحتاج إلى حل قبل النشر');
  console.log('🔧 راجع المشاكل أعلاه وأصلحها ثم أعد الفحص');
}

console.log('\n' + '='.repeat(60));
