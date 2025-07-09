// إنشاء البيانات مع الحقول الصحيحة فقط
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSimpleTestData() {
  console.log('🚀 إنشاء بيانات تجريبية بسيطة...\n');

  try {
    // 1. إنشاء مشاريع بالحقول الأساسية فقط
    console.log('1. إنشاء مشاريع بسيطة...');
    
    const simpleProjects = [
      {
        name: 'تطوير تطبيق الجوال',
        description: 'تطوير تطبيق جوال للتجارة الإلكترونية',
        budget: 75000.00,
        status: 'active',
        manager_id: 1
      },
      {
        name: 'موقع شركة تجارية',
        description: 'تصميم وتطوير موقع إلكتروني متجاوب',
        budget: 45000.00,
        status: 'active',
        manager_id: 1
      },
      {
        name: 'نظام إدارة المخزون',
        description: 'تطوير نظام شامل لإدارة المخزون والمبيعات',
        budget: 85000.00,
        status: 'completed',
        manager_id: 1
      }
    ];

    const createdProjects = [];
    for (const project of simpleProjects) {
      const { data, error } = await supabase
        .from('projects')
        .insert([project])
        .select();
      
      if (error) {
        console.log(`❌ فشل إنشاء المشروع ${project.name}:`, error.message);
      } else {
        console.log(`✅ تم إنشاء المشروع: ${project.name}`);
        createdProjects.push(data[0]);
      }
    }

    // 2. إنشاء معاملات بالحقول الأساسية فقط
    console.log('\n2. إنشاء معاملات بسيطة...');
    
    const simpleTransactions = [
      {
        amount: 25000.00,
        type: 'income',
        description: 'دفعة أولى من مشروع تطوير التطبيق',
        project_id: createdProjects[0]?.id,
        user_id: 1
      },
      {
        amount: 18000.00,
        type: 'income',
        description: 'دفعة من مشروع الموقع التجاري',
        project_id: createdProjects[1]?.id,
        user_id: 2
      },
      {
        amount: 12000.00,
        type: 'expense',
        description: 'رواتب فريق التطوير',
        user_id: 1
      },
      {
        amount: 3500.00,
        type: 'expense',
        description: 'إيجار المكتب',
        user_id: 1
      },
      {
        amount: 8500.00,
        type: 'income',
        description: 'خدمات استشارية تقنية',
        user_id: 1
      }
    ];

    for (const transaction of simpleTransactions) {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select();
      
      if (error) {
        console.log(`❌ فشل إنشاء المعاملة:`, error.message);
      } else {
        console.log(`✅ تم إنشاء المعاملة: ${transaction.description}`);
      }
    }

    // 3. عرض الإحصائيات النهائية
    console.log('\n3. إحصائيات البيانات النهائية...');
    
    const { data: usersData } = await supabase.from('users').select('*');
    const { data: projectsData } = await supabase.from('projects').select('*');
    const { data: transactionsData } = await supabase.from('transactions').select('*');

    console.log(`👥 إجمالي المستخدمين: ${usersData?.length || 0}`);
    console.log(`📊 إجمالي المشاريع: ${projectsData?.length || 0}`);
    console.log(`💰 إجمالي المعاملات: ${transactionsData?.length || 0}`);

    // حساب الإحصائيات المالية
    const totalIncome = transactionsData
      ?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    
    const totalExpenses = transactionsData
      ?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

    console.log(`💰 إجمالي الإيرادات: ${totalIncome.toLocaleString('ar-SA')} ريال`);
    console.log(`💸 إجمالي المصروفات: ${totalExpenses.toLocaleString('ar-SA')} ريال`);
    console.log(`📊 صافي الربح: ${(totalIncome - totalExpenses).toLocaleString('ar-SA')} ريال`);

    console.log('\n🎉 تم إنشاء البيانات التجريبية بنجاح!');
    console.log('🌟 النظام جاهز للاختبار الكامل!');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات:', error);
  }
}

createSimpleTestData();
