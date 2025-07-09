// Test Supabase connection with new keys
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing Supabase connection with new keys...');
console.log('URL:', process.env.VITE_SUPABASE_URL);
console.log('Anon Key:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Test connection
supabase.from('users').select('*').limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Error:', error.message);
      if (error.message.includes('does not exist')) {
        console.log('✅ Connection successful - table needs to be created');
      }
    } else {
      console.log('✅ Connection successful! Data:', data);
    }
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
  });
