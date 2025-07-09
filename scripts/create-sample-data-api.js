// إنشاء بيانات تجريبية عبر REST API - نظام المحاسبة العربي
import dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_URL = `${SUPABASE_URL}/rest/v1`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'apikey': SUPABASE_SERVICE_KEY,
  'Prefer': 'return=representation'
};

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
  }
];

async function makeRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_URL}${endpoint}`;
  const options = {
    method,
    headers,
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const result = await response.text();
    
    return {
      success: response.ok,
      status: response.status,
      data: result ? JSON.parse(result) : null,
      error: response.ok ? null : result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function createSampleData() {
  console.log('🚀 بدء إنشاء البيانات التجريبية عبر REST API...\n');

  try {
    // 1. إنشاء المستخدمين
    console.log('1. إنشاء المستخدمين التجريبيين...');
    
    const users = [];
    for (const user of sampleUsers) {
      const result = await makeRequest('/users', 'POST', user);
      if (result.success) {
        users.push(result.data);
        console.log(`✅ تم إنشاء المستخدم: ${user.name}`);
      } else {
        console.log(`⚠️  فشل في إنشاء المستخدم ${user.name}: ${result.error}`);
      }
    }

    console.log(`\n📊 تم إنشاء ${users.length} مستخدم من أصل ${sampleUsers.length}\n`);

    // 2. إنشاء المشاريع
    console.log('2. إنشاء المشاريع التجريبية...');
    
    const projects = [];
    for (const project of sampleProjects) {
      // تعيين مدير للمشروع إذا كان هناك مستخدمون
      if (users.length > 0) {
        const managers = users.filter(u => u.role === 'manager');
        if (managers.length > 0) {
          project.manager_id = managers[0].id;
          project.created_by = users[0].id;
        }
      }
      
      const result = await makeRequest('/projects', 'POST', project);
      if (result.success) {
        projects.push(result.data);
        console.log(`✅ تم إنشاء المشروع: ${project.name}`);
      } else {
        console.log(`⚠️  فشل في إنشاء المشروع ${project.name}: ${result.error}`);
      }
    }

    console.log(`\n📊 تم إنشاء ${projects.length} مشروع من أصل ${sampleProjects.length}\n`);

    // 3. إنشاء المعاملات التجريبية
    console.log('3. إنشاء المعاملات التجريبية...');
    
    const categories = ['مبيعات', 'خدمات', 'مرتبات', 'إيجار', 'كهرباء ومياه', 'مواصلات'];
    const paymentMethods = ['cash', 'bank', 'credit_card'];
    
    let transactionCount = 0;
    
    // إنشاء معاملات لكل مشروع
    for (const project of projects) {
      // إيرادات المشروع
      for (let i = 0; i < 3; i++) {
        const transaction = {
          amount: Math.floor(Math.random() * 10000) + 5000,
          type: 'income',
          category: categories[Math.floor(Math.random() * 2)], // مبيعات أو خدمات
          description: `دفعة من مشروع ${project.name} - القسط ${i + 1}`,
          project_id: project.id,
          user_id: users.length > 0 ? users[Math.floor(Math.random() * users.length)].id : null,
          payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          transaction_date: new Date(2025, Math.floor(Math.random() * 7), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
        };
        
        const result = await makeRequest('/transactions', 'POST', transaction);
        if (result.success) {
          transactionCount++;
          console.log(`✅ معاملة دخل للمشروع: ${project.name}`);
        } else {
          console.log(`⚠️  فشل في إنشاء معاملة: ${result.error}`);
        }
      }

      // مصروفات المشروع
      for (let i = 0; i < 2; i++) {
        const transaction = {
          amount: Math.floor(Math.random() * 5000) + 1000,
          type: 'expense',
          category: categories[Math.floor(Math.random() * 4) + 2], // من المصروفات
          description: `مصروف مشروع ${project.name} - ${categories[Math.floor(Math.random() * 4) + 2]}`,
          project_id: project.id,
          user_id: users.length > 0 ? users[Math.floor(Math.random() * users.length)].id : null,
          payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          transaction_date: new Date(2025, Math.floor(Math.random() * 7), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
        };
        
        const result = await makeRequest('/transactions', 'POST', transaction);
        if (result.success) {
          transactionCount++;
          console.log(`✅ معاملة مصروف للمشروع: ${project.name}`);
        } else {
          console.log(`⚠️  فشل في إنشاء معاملة: ${result.error}`);
        }
      }
    }

    // معاملات عامة (غير مرتبطة بمشاريع)
    console.log('\n4. إنشاء معاملات عامة...');
    for (let i = 0; i < 10; i++) {
      const isIncome = Math.random() > 0.4;
      const transaction = {
        amount: Math.floor(Math.random() * 8000) + 2000,
        type: isIncome ? 'income' : 'expense',
        category: categories[isIncome ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 4) + 2],
        description: `معاملة عامة - ${isIncome ? 'إيراد' : 'مصروف'} ${i + 1}`,
        user_id: users.length > 0 ? users[Math.floor(Math.random() * users.length)].id : null,
        payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        transaction_date: new Date(2025, Math.floor(Math.random() * 7), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
      };
      
      const result = await makeRequest('/transactions', 'POST', transaction);
      if (result.success) {
        transactionCount++;
        console.log(`✅ معاملة عامة ${i + 1}`);
      } else {
        console.log(`⚠️  فشل في إنشاء معاملة عامة: ${result.error}`);
      }
    }

    console.log(`\n📊 تم إنشاء ${transactionCount} معاملة\n`);

    // 5. عرض ملخص البيانات
    console.log('\n' + '='.repeat(50));
    console.log('🎉 تم إنشاء البيانات التجريبية بنجاح!');
    console.log('='.repeat(50));
    console.log('📋 ملخص البيانات المُنشأة:');
    console.log(`   👥 المستخدمون: ${users.length}`);
    console.log(`   📊 المشاريع: ${projects.length}`);
    console.log(`   💰 المعاملات: ${transactionCount}`);
    console.log('\n🌟 يمكنك الآن استكشاف النظام بالبيانات التجريبية!');
    console.log('🔗 افتح المتصفح على: http://localhost:3000');
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
