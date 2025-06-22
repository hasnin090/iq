import { databaseCleanup } from './server/database-cleanup.js';

async function testCleanup() {
  console.log('🔍 بدء اختبار تنظيف قاعدة البيانات...');
  
  try {
    // Get system status first
    console.log('📊 جاري الحصول على حالة النظام...');
    const status = await databaseCleanup.getSystemStatus();
    console.log('حالة النظام:', JSON.stringify(status, null, 2));
    
    // Run cleanup
    console.log('\n🗑️ تشغيل تنظيف قاعدة البيانات...');
    const cleanupResult = await databaseCleanup.cleanupDatabase();
    console.log('نتيجة التنظيف:', JSON.stringify(cleanupResult, null, 2));
    
  } catch (error) {
    console.error('❌ خطأ أثناء اختبار التنظيف:', error);
  }
}

testCleanup();