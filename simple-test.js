// Simple test
require('dotenv').config();
console.log('Environment variables loaded');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

const { createClient } = require('@supabase/supabase-js');

try {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL, 
    process.env.VITE_SUPABASE_ANON_KEY
  );
  
  console.log('✅ Supabase client created successfully');
  
  // Test a simple query
  supabase.from('users').select('*').limit(1).then(({ data, error }) => {
    if (error) {
      console.log('❌ Error:', error.message);
      // This is expected if table doesn't exist
      if (error.message.includes('does not exist')) {
        console.log('✅ Connection works - table just needs to be created');
      }
    } else {
      console.log('✅ Query successful:', data);
    }
  }).catch(err => {
    console.error('❌ Query failed:', err.message);
  });
  
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error.message);
}
