// إنشاء بيانات تجريبية - نظام المحاسبة العربي
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// بيانات تجريبية
const sampleUsers = [
  { name: 'أحمد محمد', email: 'ahmed@example.com', role: 'manager', phone: '+20123456789' },
  { name: 'فاطمة علي', email: 'fatima@example.com', role: 'user', phone: '+20987654321' },
  { name: 'محمد حسن', email: 'mohamed@example.com', role: 'user', phone: '+20555123456' },
  { name: 'سارة أحمد', email: 'sara@example.com', role: 'manager', phone: '+20444987654' },
  { name: 'عمر خالد', email: 'omar@example.com', role: 'user', phone: '+20333567890' }
];

const sampleProjects = [
  {
    name: 'تطوير تطبيق الجوال',
    description: 'تطوير تطبيق جوال للتجارة الإلكترونية',
    budget: 50000.00,
    start_date: '2025-01-01',
    end_date: '2025-06-30',
    status: 'active',
    client_name: 'شركة التقنية المتقدمة',
    client_email: 'info@techadvanced.com',
    client_phone: '+20111222333'
  },
  {
    name: 'موقع الشركة الجديد',
    description: 'تصميم وتطوير موقع إلكتروني متجاوب',
    budget: 25000.00,
    start_date: '2025-02-01',
    end_date: '2025-04-30',
    status: 'active',
    client_name: 'مؤسسة النجاح',
    client_email: 'contact@success.com',
    client_phone: '+20222333444'
  },
  {
    name: 'نظام إدارة المخزون',
    description: 'تطوير نظام شامل لإدارة المخزون والمبيعات',
    budget: 75000.00,
    start_date: '2024-10-01',
    end_date: '2025-03-31',
    status: 'completed',
    client_name: 'شركة التوزيع الكبرى',
    client_email: 'admin@distribution.com',
    client_phone: '+20333444555'
  },
  {
    name: 'تحديث النظام المحاسبي',
    description: 'تحديث وتطوير النظام المحاسبي الحالي',
    budget: 35000.00,
    start_date: '2025-03-01',
    end_date: '2025-08-31',
    status: 'paused',
    client_name: 'مكتب المحاسبة المتخصص',
    client_email: 'info@accounting.com',
    client_phone: '+20444555666'
  }
];

async function createSampleData() {
  console.log('🚀 بدء إنشاء البيانات التجريبية...\n');

  try {
    // 1. إنشاء المستخدمين
    console.log('1. إنشاء المستخدمين التجريبيين...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .insert(sampleUsers)
      .select();

    if (usersError) {
      console.error('❌ خطأ في إنشاء المستخدمين:', usersError.message);
      return;
    }
    console.log(`✅ تم إنشاء ${users.length} مستخدم`);

    // 2. إنشاء المشاريع
    console.log('\n2. إنشاء المشاريع التجريبية...');
    
    // تعيين مديرين للمشاريع
    const managers = users.filter(user => user.role === 'manager');
    const projectsWithManagers = sampleProjects.map((project, index) => ({
      ...project,
      manager_id: managers[index % managers.length]?.id,
      created_by: users[0]?.id // المدير العام
    }));

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .insert(projectsWithManagers)
      .select();

    if (projectsError) {
      console.error('❌ خطأ في إنشاء المشاريع:', projectsError.message);
      return;
    }
    console.log(`✅ تم إنشاء ${projects.length} مشروع`);

    // 3. إنشاء المعاملات التجريبية
    console.log('\n3. إنشاء المعاملات التجريبية...');
    
    const sampleTransactions = [];
    const categories = ['مبيعات', 'خدمات', 'مرتبات', 'إيجار', 'كهرباء ومياه', 'مواصلات'];
    const paymentMethods = ['cash', 'bank', 'credit_card'];

    // إنشاء معاملات لكل مشروع
    for (const project of projects) {
      // إيرادات المشروع
      for (let i = 0; i < 3; i++) {
        sampleTransactions.push({
          amount: Math.floor(Math.random() * 10000) + 5000,
          type: 'income',
          category: categories[Math.floor(Math.random() * 2)], // مبيعات أو خدمات
          description: `دفعة من مشروع ${project.name} - القسط ${i + 1}`,
          project_id: project.id,
          user_id: users[Math.floor(Math.random() * users.length)].id,
          payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          transaction_date: new Date(2025, Math.floor(Math.random() * 7), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
        });
      }

      // مصروفات المشروع
      for (let i = 0; i < 2; i++) {
        sampleTransactions.push({
          amount: Math.floor(Math.random() * 5000) + 1000,
          type: 'expense',
          category: categories[Math.floor(Math.random() * 4) + 2], // من المصروفات
          description: `مصروف مشروع ${project.name} - ${categories[Math.floor(Math.random() * 4) + 2]}`,
          project_id: project.id,
          user_id: users[Math.floor(Math.random() * users.length)].id,
          payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          transaction_date: new Date(2025, Math.floor(Math.random() * 7), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
        });
      }
    }

    // معاملات عامة (غير مرتبطة بمشاريع)
    for (let i = 0; i < 10; i++) {
      const isIncome = Math.random() > 0.4;
      sampleTransactions.push({
        amount: Math.floor(Math.random() * 8000) + 2000,
        type: isIncome ? 'income' : 'expense',
        category: categories[isIncome ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 4) + 2],
        description: `معاملة عامة - ${isIncome ? 'إيراد' : 'مصروف'} ${i + 1}`,
        user_id: users[Math.floor(Math.random() * users.length)].id,
        payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        transaction_date: new Date(2025, Math.floor(Math.random() * 7), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
      });
    }

    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .insert(sampleTransactions)
      .select();

    if (transactionsError) {
      console.error('❌ خطأ في إنشاء المعاملات:', transactionsError.message);
      return;
    }
    console.log(`✅ تم إنشاء ${transactions.length} معاملة`);

    // 4. إحصائيات سريعة
    console.log('\n4. إحصائيات البيانات المُنشأة...');
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    console.log(`💰 إجمالي الإيرادات: ${totalIncome.toLocaleString('ar-EG')} جنيه`);
    console.log(`💸 إجمالي المصروفات: ${totalExpenses.toLocaleString('ar-EG')} جنيه`);
    console.log(`📊 صافي الربح: ${(totalIncome - totalExpenses).toLocaleString('ar-EG')} جنيه`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 تم إنشاء البيانات التجريبية بنجاح!');
    console.log('='.repeat(50));
    console.log('📋 ملخص البيانات المُنشأة:');
    console.log(`   👥 المستخدمون: ${users.length}`);
    console.log(`   📊 المشاريع: ${projects.length}`);
    console.log(`   💰 المعاملات: ${transactions.length}`);
    console.log('\n🌟 يمكنك الآن استكشاف النظام بالبيانات التجريبية!');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('\n❌ خطأ في إنشاء البيانات التجريبية:', error);
  }
}

// تشغيل إنشاء البيانات
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleData();
}

export default createSampleData;
