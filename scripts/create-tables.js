// إنشاء الجداول الأساسية في Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // استخدام service role key
);

async function createTables() {
  console.log('🚀 بدء إنشاء الجداول الأساسية...\n');

  try {
    // 1. إنشاء جدول المستخدمين
    console.log('1. إنشاء جدول المستخدمين...');
    
    const { data: userData, error: userError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT DEFAULT 'user',
          phone TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- إزالة RLS مؤقتاً للاختبار
        ALTER TABLE users DISABLE ROW LEVEL SECURITY;
      `
    });

    if (userError) {
      console.log('⚠️ إنشاء جدول المستخدمين باستخدام طريقة بديلة...');
      
      // طريقة بديلة - إدراج بيانات مباشرة
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert([
          { name: 'أحمد محمد', email: 'ahmed@test.com', role: 'admin' }
        ]);
      
      if (insertError) {
        console.log('❌ خطأ في إنشاء المستخدم:', insertError.message);
      } else {
        console.log('✅ تم إنشاء مستخدم تجريبي');
      }
    } else {
      console.log('✅ تم إنشاء جدول المستخدمين');
    }

    // 2. إنشاء جدول المشاريع
    console.log('\n2. إنشاء جدول المشاريع...');
    
    const { data: projectData, error: projectError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS projects (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          budget DECIMAL(15,2),
          status TEXT DEFAULT 'active',
          client_name TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
      `
    });

    if (projectError) {
      console.log('⚠️ مشكلة في إنشاء جدول المشاريع:', projectError.message);
    } else {
      console.log('✅ تم إنشاء جدول المشاريع');
    }

    // 3. إنشاء جدول المعاملات
    console.log('\n3. إنشاء جدول المعاملات...');
    
    const { data: transactionData, error: transactionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          amount DECIMAL(15,2) NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
          description TEXT,
          category TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
      `
    });

    if (transactionError) {
      console.log('⚠️ مشكلة في إنشاء جدول المعاملات:', transactionError.message);
    } else {
      console.log('✅ تم إنشاء جدول المعاملات');
    }

    console.log('\n🎉 انتهى إنشاء الجداول!');
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

createTables();
