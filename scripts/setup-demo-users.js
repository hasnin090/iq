#!/usr/bin/env node

// Script to create demo users in Supabase Auth
// Run this script to set up demo users for testing

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jcoekbaahgjympmnuilr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // أضف هذا في متغيرات البيئة

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  console.log('📝 Add this to your environment variables or .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const demoUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    user_metadata: {
      name: 'المدير العام',
      role: 'admin',
      permissions: ['manage_all', 'view_reports', 'manage_users']
    }
  },
  {
    email: 'manager@example.com',
    password: 'manager123',
    user_metadata: {
      name: 'مدير المشاريع',
      role: 'manager',
      permissions: ['view_reports', 'manage_projects']
    }
  },
  {
    email: 'user@example.com',
    password: 'user123',
    user_metadata: {
      name: 'المستخدم العادي',
      role: 'user',
      permissions: ['view_basic']
    }
  }
];

async function createDemoUsers() {
  console.log('🚀 Creating demo users in Supabase...\n');

  for (const userData of demoUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: userData.user_metadata,
        email_confirm: true // تأكيد البريد الإلكتروني تلقائياً
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          console.log(`⚠️  ${userData.email}: User already exists`);
        } else {
          console.error(`❌ ${userData.email}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${userData.email}: User created successfully`);
        console.log(`   Name: ${userData.user_metadata.name}`);
        console.log(`   Role: ${userData.user_metadata.role}\n`);
      }
    } catch (error) {
      console.error(`❌ ${userData.email}: ${error.message}`);
    }
  }

  console.log('🎉 Demo users setup completed!');
  console.log('\n📝 You can now login with:');
  console.log('   admin@example.com / admin123');
  console.log('   manager@example.com / manager123');
  console.log('   user@example.com / user123');
}

createDemoUsers().catch(console.error);
