// فحص بنية الجداول الموجودة
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectTables() {
  console.log('🔍 فحص بنية الجداول الموجودة...\n');

  try {
    // فحص جدول المستخدمين
    console.log('1. فحص جدول المستخدمين...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ خطأ في جدول المستخدمين:', usersError.message);
    } else {
      console.log('✅ جدول المستخدمين موجود');
      console.log('📋 البيانات:', usersData);
    }

    // فحص جدول المشاريع
    console.log('\n2. فحص جدول المشاريع...');
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectsError) {
      console.log('❌ خطأ في جدول المشاريع:', projectsError.message);
    } else {
      console.log('✅ جدول المشاريع موجود');
      console.log('📋 البيانات:', projectsData);
    }

    // فحص جدول المعاملات
    console.log('\n3. فحص جدول المعاملات...');
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);
    
    if (transactionsError) {
      console.log('❌ خطأ في جدول المعاملات:', transactionsError.message);
    } else {
      console.log('✅ جدول المعاملات موجود');
      console.log('📋 البيانات:', transactionsData);
    }

    // محاولة إنشاء مستخدم تجريبي
    console.log('\n4. محاولة إنشاء مستخدم تجريبي...');
    const { data: newUser, error: newUserError } = await supabase
      .from('users')
      .insert([{
        username: 'ahmed_test', // استخدام username بدلاً من name
        email: 'ahmed@test.com',
        role: 'admin'
      }])
      .select();
    
    if (newUserError) {
      console.log('❌ خطأ في إنشاء المستخدم:', newUserError.message);
      
      // محاولة بحقول أخرى
      console.log('\n5. محاولة مع حقول مختلفة...');
      const { data: newUser2, error: newUserError2 } = await supabase
        .from('users')
        .insert([{
          name: 'أحمد محمد',
          email: 'ahmed2@test.com'
        }])
        .select();
      
      if (newUserError2) {
        console.log('❌ خطأ في المحاولة الثانية:', newUserError2.message);
      } else {
        console.log('✅ تم إنشاء المستخدم:', newUser2);
      }
    } else {
      console.log('✅ تم إنشاء المستخدم:', newUser);
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

inspectTables();
