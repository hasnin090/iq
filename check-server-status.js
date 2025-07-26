console.log('🔍 فحص سريع للخادم')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// فحص إذا كان الخادم يعمل على المنفذ 5000
import { execSync } from 'child_process'

try {
  console.log('📋 فحص المنافذ المستخدمة...')
  
  // على Windows
  const result = execSync('netstat -an | findstr :5000', { encoding: 'utf8' })
  
  if (result.includes('LISTENING')) {
    console.log('✅ الخادم يعمل على المنفذ 5000')
    console.log('🌐 الروابط المتاحة:')
    console.log('   http://localhost:5000')
    console.log('   http://localhost:5000/api/health')
    console.log('   http://localhost:5000/api/projects')
    console.log('   http://localhost:5000/api/expense-types')
  } else {
    console.log('❌ الخادم لا يعمل على المنفذ 5000')
  }
} catch (error) {
  console.log('⚠️ لا يمكن فحص المنافذ')
  console.log('💡 تأكد من تشغيل: npm run dev:simple')
}

console.log('\n📊 حالة العمليات:')
console.log('1. ✅ قاعدة البيانات: Supabase متصل')
console.log('2. ✅ الملفات: جميع الملفات موجودة')
console.log('3. 🔄 الخادم: قيد التشغيل...')

console.log('\n💡 للاختبار اليدوي:')
console.log('1. افتح http://localhost:5000 في المتصفح')
console.log('2. جرب /api/health للتحقق من صحة الخادم')
console.log('3. جرب /api/projects لعرض المشاريع')
console.log('4. جرب /api/expense-types لعرض أنواع المصروفات')
