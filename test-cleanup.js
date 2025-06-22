const { databaseCleanup } = require('./server/database-cleanup');

async function testCleanup() {
  console.log('🔍 Starting database cleanup test...');
  
  try {
    // Get system status first
    console.log('📊 Getting system status...');
    const status = await databaseCleanup.getSystemStatus();
    console.log('System Status:', JSON.stringify(status, null, 2));
    
    // Run cleanup
    console.log('\n🗑️ Running database cleanup...');
    const cleanupResult = await databaseCleanup.cleanupDatabase();
    console.log('Cleanup Result:', JSON.stringify(cleanupResult, null, 2));
    
    // Get updated status
    console.log('\n📊 Getting updated system status...');
    const updatedStatus = await databaseCleanup.getSystemStatus();
    console.log('Updated Status:', JSON.stringify(updatedStatus, null, 2));
    
  } catch (error) {
    console.error('❌ Error during cleanup test:', error);
  }
}

testCleanup();