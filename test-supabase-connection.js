// Test connection to Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NOT SET');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the connection
async function testConnection() {
  try {
    console.log('🔄 Attempting to connect to Supabase...');
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection error:', error.message);
      
      // If users table doesn't exist, that's expected
      if (error.message.includes('users') && error.message.includes('does not exist')) {
        console.log('✅ Connection successful - users table needs to be created');
        return true;
      }
      return false;
    }
    
    console.log('✅ Connection successful - database is ready');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

testConnection().then((success) => {
  if (success) {
    console.log('✅ Supabase connection test passed');
  } else {
    console.log('❌ Supabase connection test failed');
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ Test failed with error:', error.message);
  process.exit(1);
});
