// Test connection to Supabase with new keys
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing Supabase connection with updated keys...');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NOT SET');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('🔄 Testing connection to users table...');
    
    // Test connection to users table
    const { data, error } = await supabase
      .from('users')
      .select('id, username, name, role')
      .limit(5);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return false;
    }
    
    console.log('✅ Connection successful!');
    console.log('📊 Users in database:', data.length);
    
    if (data.length > 0) {
      console.log('👥 Sample users:');
      data.forEach(user => {
        console.log(`   - ${user.username} (${user.name}) - ${user.role}`);
      });
    }
    
    // Test other tables
    console.log('\n🔄 Testing other tables...');
    
    const { data: projects } = await supabase.from('projects').select('*').limit(1);
    console.log('📋 Projects table:', projects ? 'OK' : 'Empty');
    
    const { data: transactions } = await supabase.from('transactions').select('*').limit(1);
    console.log('💰 Transactions table:', transactions ? 'OK' : 'Empty');
    
    const { data: expenseTypes } = await supabase.from('expense_types').select('*').limit(1);
    console.log('📝 Expense types table:', expenseTypes ? 'OK' : 'Empty');
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

testConnection().then((success) => {
  if (success) {
    console.log('\n✅ All tests passed! Database is ready.');
  } else {
    console.log('\n❌ Connection test failed.');
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ Test failed with error:', error.message);
  process.exit(1);
});
