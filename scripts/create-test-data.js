// إنشاء بيانات تجريبية مبسطة
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function createTestData() {
  console.log('🚀 بدء إنشاء البيانات التجريبية...\n');

  try {
    // إنشاء مستخدمين تجريبيين
    console.log('1. إنشاء المستخدمين...');
    
    const users = [
      { name: 'أحمد محمد', email: 'ahmed@test.com', role: 'admin' },
      { name: 'فاطمة علي', email: 'fatima@test.com', role: 'user' },
      { name: 'محمد حسن', email: 'mohamed@test.com', role: 'manager' }
    ];

    for (const user of users) {
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ تم إنشاء المستخدم: ${user.name}`);
      } else {
        console.log(`❌ فشل إنشاء المستخدم: ${user.name}`);
      }
    }

    // إنشاء مشاريع تجريبية
    console.log('\n2. إنشاء المشاريع...');
    
    const projects = [
      {
        name: 'تطوير تطبيق الجوال',
        description: 'تطوير تطبيق جوال للتجارة الإلكترونية',
        budget: 50000,
        status: 'active',
        client_name: 'شركة التقنية'
      },
      {
        name: 'موقع الشركة',
        description: 'تصميم وتطوير موقع إلكتروني',
        budget: 25000,
        status: 'active',
        client_name: 'مؤسسة النجاح'
      }
    ];

    for (const project of projects) {
      const response = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ تم إنشاء المشروع: ${project.name}`);
      } else {
        console.log(`❌ فشل إنشاء المشروع: ${project.name}`);
      }
    }

    // إنشاء معاملات تجريبية
    console.log('\n3. إنشاء المعاملات...');
    
    const transactions = [
      {
        amount: 15000,
        type: 'income',
        description: 'دفعة أولى من مشروع التطبيق',
        category: 'مبيعات'
      },
      {
        amount: 8000,
        type: 'expense',
        description: 'مرتبات الفريق',
        category: 'مرتبات'
      },
      {
        amount: 2500,
        type: 'expense',
        description: 'إيجار المكتب',
        category: 'إيجار'
      },
      {
        amount: 12000,
        type: 'income',
        description: 'دفعة من مشروع الموقع',
        category: 'خدمات'
      }
    ];

    for (const transaction of transactions) {
      const response = await fetch('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ تم إنشاء المعاملة: ${transaction.description}`);
      } else {
        console.log(`❌ فشل إنشاء المعاملة: ${transaction.description}`);
      }
    }

    console.log('\n🎉 تم إنشاء البيانات التجريبية بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات:', error);
  }
}

createTestData();
