// إنشاء بيانات تجريبية بالتنسيق الصحيح
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createCorrectTestData() {
  console.log('🚀 بدء إنشاء البيانات التجريبية بالتنسيق الصحيح...\n');

  try {
    // 1. إنشاء مستخدمين إضافيين
    console.log('1. إنشاء مستخدمين إضافيين...');
    
    const users = [
      {
        username: 'ahmed_mohamed',
        name: 'أحمد محمد',
        email: 'ahmed@company.com',
        role: 'manager',
        password_hash: '$2b$10$example_hash_ahmed',
        active: true
      },
      {
        username: 'fatima_ali',
        name: 'فاطمة علي',
        email: 'fatima@company.com',
        role: 'user',
        password_hash: '$2b$10$example_hash_fatima',
        active: true
      },
      {
        username: 'mohamed_hassan',
        name: 'محمد حسن',
        email: 'mohamed@company.com',
        role: 'user',
        password_hash: '$2b$10$example_hash_mohamed',
        active: true
      }
    ];

    for (const user of users) {
      const { data, error } = await supabase
        .from('users')
        .insert([user])
        .select();
      
      if (error) {
        console.log(`❌ فشل إنشاء المستخدم ${user.name}:`, error.message);
      } else {
        console.log(`✅ تم إنشاء المستخدم: ${user.name}`);
      }
    }

    // 2. إنشاء مشاريع تجريبية
    console.log('\n2. إنشاء مشاريع تجريبية...');
    
    const projects = [
      {
        name: 'تطوير تطبيق الجوال',
        description: 'تطوير تطبيق جوال للتجارة الإلكترونية متكامل مع جميع الميزات الحديثة',
        budget: 75000.00,
        start_date: '2025-01-01',
        end_date: '2025-06-30',
        status: 'active',
        client_name: 'شركة التقنية المتقدمة',
        client_email: 'info@techadvanced.com',
        client_phone: '+966501234567',
        manager_id: 1
      },
      {
        name: 'موقع شركة تجارية',
        description: 'تصميم وتطوير موقع إلكتروني متجاوب مع لوحة تحكم إدارية',
        budget: 45000.00,
        start_date: '2025-02-01',
        end_date: '2025-05-31',
        status: 'active',
        client_name: 'مؤسسة النجاح التجارية',
        client_email: 'contact@success-trading.com',
        client_phone: '+966507654321',
        manager_id: 1
      },
      {
        name: 'نظام إدارة المخزون',
        description: 'تطوير نظام شامل لإدارة المخزون والمبيعات مع تقارير تفصيلية',
        budget: 85000.00,
        start_date: '2024-11-01',
        end_date: '2025-04-30',
        status: 'completed',
        client_name: 'شركة التوزيع الكبرى',
        client_email: 'orders@distribution-corp.com',
        client_phone: '+966502345678',
        manager_id: 1
      }
    ];

    for (const project of projects) {
      const { data, error } = await supabase
        .from('projects')
        .insert([project])
        .select();
      
      if (error) {
        console.log(`❌ فشل إنشاء المشروع ${project.name}:`, error.message);
      } else {
        console.log(`✅ تم إنشاء المشروع: ${project.name}`);
      }
    }

    // 3. إنشاء معاملات مالية تجريبية
    console.log('\n3. إنشاء معاملات مالية تجريبية...');
    
    // الحصول على المشاريع المُنشأة
    const { data: createdProjects } = await supabase
      .from('projects')
      .select('id, name');

    // الحصول على المستخدمين
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, name');

    const transactions = [
      // معاملات المشروع الأول
      {
        amount: 25000.00,
        type: 'income',
        description: 'دفعة أولى من مشروع تطوير التطبيق',
        category: 'مبيعات',
        project_id: createdProjects?.[0]?.id,
        user_id: allUsers?.[0]?.id,
        payment_method: 'bank_transfer',
        status: 'completed',
        transaction_date: '2025-01-15'
      },
      {
        amount: 15000.00,
        type: 'income',
        description: 'دفعة ثانية من مشروع تطوير التطبيق',
        category: 'مبيعات',
        project_id: createdProjects?.[0]?.id,
        user_id: allUsers?.[0]?.id,
        payment_method: 'bank_transfer',
        status: 'completed',
        transaction_date: '2025-03-15'
      },
      // معاملات المشروع الثاني
      {
        amount: 18000.00,
        type: 'income',
        description: 'دفعة أولى من مشروع الموقع التجاري',
        category: 'خدمات',
        project_id: createdProjects?.[1]?.id,
        user_id: allUsers?.[1]?.id,
        payment_method: 'cash',
        status: 'completed',
        transaction_date: '2025-02-10'
      },
      // مصروفات عامة
      {
        amount: 12000.00,
        type: 'expense',
        description: 'رواتب فريق التطوير - شهر يناير',
        category: 'مرتبات',
        user_id: allUsers?.[0]?.id,
        payment_method: 'bank_transfer',
        status: 'completed',
        transaction_date: '2025-01-30'
      },
      {
        amount: 3500.00,
        type: 'expense',
        description: 'إيجار المكتب - شهر يناير',
        category: 'إيجار',
        user_id: allUsers?.[0]?.id,
        payment_method: 'bank_transfer',
        status: 'completed',
        transaction_date: '2025-01-05'
      },
      {
        amount: 1200.00,
        type: 'expense',
        description: 'فواتير الكهرباء والمياه',
        category: 'مصروفات تشغيلية',
        user_id: allUsers?.[2]?.id,
        payment_method: 'cash',
        status: 'completed',
        transaction_date: '2025-01-20'
      },
      {
        amount: 2800.00,
        type: 'expense',
        description: 'تكاليف تسويق وإعلان',
        category: 'تسويق',
        user_id: allUsers?.[1]?.id,
        payment_method: 'credit_card',
        status: 'completed',
        transaction_date: '2025-02-05'
      },
      // معاملات حديثة
      {
        amount: 8500.00,
        type: 'income',
        description: 'خدمات استشارية تقنية',
        category: 'استشارات',
        user_id: allUsers?.[0]?.id,
        payment_method: 'bank_transfer',
        status: 'completed',
        transaction_date: '2025-07-01'
      }
    ];

    for (const transaction of transactions) {
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

    // 4. عرض الإحصائيات النهائية
    console.log('\n4. إحصائيات البيانات المُنشأة...');
    
    const [usersCount, projectsCount, transactionsCount] = await Promise.all([
      supabase.from('users').select('count(*)', { count: 'exact', head: true }),
      supabase.from('projects').select('count(*)', { count: 'exact', head: true }),
      supabase.from('transactions').select('count(*)', { count: 'exact', head: true })
    ]);

    console.log(`👥 إجمالي المستخدمين: ${usersCount.count}`);
    console.log(`📊 إجمالي المشاريع: ${projectsCount.count}`);
    console.log(`💰 إجمالي المعاملات: ${transactionsCount.count}`);

    console.log('\n🎉 تم إنشاء البيانات التجريبية بنجاح!');
    console.log('📋 يمكنك الآن اختبار جميع وظائف النظام');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات:', error);
  }
}

createCorrectTestData();
