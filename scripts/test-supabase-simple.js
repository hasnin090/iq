#!/usr/bin/env node

// اختبار اتصال Supabase بسيط ومباشر
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('🚀 اختبار اتصال Supabase...\n');

// اختبار اتصال REST API مع Supabase
async function testSupabaseConnection() {
  try {
    console.log(`🔗 URL: ${SUPABASE_URL}`);
    console.log(`🔑 Key: ${SUPABASE_ANON_KEY ? 'موجود' : 'غير موجود'}\n`);

    // اختبار REST API
    const restUrl = `${SUPABASE_URL}/rest/v1/`;
    console.log('📡 اختبار REST API...');
    
    const response = await fetch(restUrl, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ REST API يعمل بشكل صحيح');
      
      // محاولة الوصول إلى جدول المستخدمين
      console.log('\n👥 اختبار جدول المستخدمين...');
      const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=count`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        }
      });

      if (usersResponse.ok) {
        console.log('✅ جدول users متاح');
      } else {
        console.log(`⚠️ جدول users: ${usersResponse.status} - ${usersResponse.statusText}`);
      }

      // محاولة الوصول إلى جدول المشاريع
      console.log('\n📋 اختبار جدول المشاريع...');
      const projectsResponse = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=count`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        }
      });

      if (projectsResponse.ok) {
        console.log('✅ جدول projects متاح');
      } else {
        console.log(`⚠️ جدول projects: ${projectsResponse.status} - ${projectsResponse.statusText}`);
      }

    } else {
      console.log(`❌ خطأ في REST API: ${response.status} - ${response.statusText}`);
    }

  } catch (error) {
    console.log(`❌ خطأ في الاتصال: ${error.message}`);
  }
}

// تشغيل الاختبار
testSupabaseConnection().then(() => {
  console.log('\n🎯 انتهى الاختبار');
}).catch(error => {
  console.error('❌ خطأ غير متوقع:', error);
  process.exit(1);
});
