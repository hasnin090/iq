// برنامج اختبار شامل لجميع وظائف النظام
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:3000/api';

async function testAllFunctions() {
  console.log('🧪 بدء اختبار شامل لجميع وظائف النظام');
  console.log('=' .repeat(60) + '\n');

  const results = {
    health: false,
    supabase: false,
    users: { get: false, post: false, put: false, delete: false },
    projects: { get: false, post: false, put: false, delete: false },
    transactions: { get: false, post: false, put: false, delete: false },
    statistics: false
  };

  try {
    // 1. اختبار فحص الصحة
    console.log('1. 🔍 اختبار فحص صحة السيرفر...');
    try {
      const healthResponse = await fetch(`${API_BASE}/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        results.health = true;
        console.log('✅ فحص الصحة: النظام يعمل بشكل طبيعي');
        console.log(`   📊 البيئة: ${healthData.environment}`);
        console.log(`   📦 الإصدار: ${healthData.version}`);
        console.log(`   🔗 Supabase: ${healthData.supabase.configured ? 'مُعدّ' : 'غير مُعدّ'}`);
      } else {
        console.log('❌ فحص الصحة: فشل في الاستجابة');
      }
    } catch (error) {
      console.log('❌ فحص الصحة: خطأ في الاتصال');
    }

    // 2. اختبار Supabase
    console.log('\n2. 🧪 اختبار اتصال Supabase...');
    try {
      const supabaseResponse = await fetch(`${API_BASE}/test-supabase`);
      if (supabaseResponse.ok) {
        const supabaseData = await supabaseResponse.json();
        results.supabase = supabaseData.overall;
        console.log(`✅ اختبار Supabase: ${supabaseData.overall ? 'نجح' : 'فشل جزئياً'}`);
        console.log(`   🔗 الاتصال: ${supabaseData.tests.connection ? '✅' : '❌'}`);
        console.log(`   📦 التخزين: ${supabaseData.tests.storage ? '✅' : '❌'}`);
        console.log(`   🔒 المصادقة: ${supabaseData.tests.auth ? '✅' : '❌'}`);
      } else {
        console.log('❌ اختبار Supabase: فشل في الاستجابة');
      }
    } catch (error) {
      console.log('❌ اختبار Supabase: خطأ في الاتصال');
    }

    // 3. اختبار API المستخدمين
    console.log('\n3. 👥 اختبار API المستخدمين...');
    
    // GET Users
    try {
      const usersResponse = await fetch(`${API_BASE}/users`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        results.users.get = true;
        console.log(`✅ جلب المستخدمين: نجح (${usersData.length} مستخدم)`);
      } else {
        console.log('❌ جلب المستخدمين: فشل');
      }
    } catch (error) {
      console.log('❌ جلب المستخدمين: خطأ في الاتصال');
    }

    // POST User
    try {
      const newUser = {
        username: 'test_user',
        name: 'مستخدم تجريبي',
        email: 'test@example.com',
        role: 'user',
        password_hash: '$2b$10$test_hash',
        active: true
      };
      
      const createUserResponse = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      if (createUserResponse.ok) {
        const createdUser = await createUserResponse.json();
        results.users.post = true;
        console.log('✅ إنشاء مستخدم: نجح');
        
        // PUT User (تحديث المستخدم)
        try {
          const updateData = { name: 'مستخدم محدث' };
          const updateResponse = await fetch(`${API_BASE}/users/${createdUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          });
          
          if (updateResponse.ok) {
            results.users.put = true;
            console.log('✅ تحديث مستخدم: نجح');
          } else {
            console.log('❌ تحديث مستخدم: فشل');
          }
        } catch (error) {
          console.log('❌ تحديث مستخدم: خطأ في الاتصال');
        }
        
        // DELETE User
        try {
          const deleteResponse = await fetch(`${API_BASE}/users/${createdUser.id}`, {
            method: 'DELETE'
          });
          
          if (deleteResponse.ok) {
            results.users.delete = true;
            console.log('✅ حذف مستخدم: نجح');
          } else {
            console.log('❌ حذف مستخدم: فشل');
          }
        } catch (error) {
          console.log('❌ حذف مستخدم: خطأ في الاتصال');
        }
        
      } else {
        console.log('❌ إنشاء مستخدم: فشل');
      }
    } catch (error) {
      console.log('❌ إنشاء مستخدم: خطأ في الاتصال');
    }

    // 4. اختبار API المشاريع
    console.log('\n4. 📊 اختبار API المشاريع...');
    
    // GET Projects
    try {
      const projectsResponse = await fetch(`${API_BASE}/projects`);
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        results.projects.get = true;
        console.log(`✅ جلب المشاريع: نجح (${projectsData.length} مشروع)`);
      } else {
        console.log('❌ جلب المشاريع: فشل');
      }
    } catch (error) {
      console.log('❌ جلب المشاريع: خطأ في الاتصال');
    }

    // POST Project
    try {
      const newProject = {
        name: 'مشروع تجريبي',
        description: 'وصف المشروع التجريبي',
        budget: 10000.00,
        status: 'active'
      };
      
      const createProjectResponse = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      
      if (createProjectResponse.ok) {
        const createdProject = await createProjectResponse.json();
        results.projects.post = true;
        console.log('✅ إنشاء مشروع: نجح');
        
        // PUT Project
        try {
          const updateData = { name: 'مشروع محدث' };
          const updateResponse = await fetch(`${API_BASE}/projects/${createdProject.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          });
          
          if (updateResponse.ok) {
            results.projects.put = true;
            console.log('✅ تحديث مشروع: نجح');
          } else {
            console.log('❌ تحديث مشروع: فشل');
          }
        } catch (error) {
          console.log('❌ تحديث مشروع: خطأ في الاتصال');
        }
        
        // DELETE Project
        try {
          const deleteResponse = await fetch(`${API_BASE}/projects/${createdProject.id}`, {
            method: 'DELETE'
          });
          
          if (deleteResponse.ok) {
            results.projects.delete = true;
            console.log('✅ حذف مشروع: نجح');
          } else {
            console.log('❌ حذف مشروع: فشل');
          }
        } catch (error) {
          console.log('❌ حذف مشروع: خطأ في الاتصال');
        }
        
      } else {
        console.log('❌ إنشاء مشروع: فشل');
      }
    } catch (error) {
      console.log('❌ إنشاء مشروع: خطأ في الاتصال');
    }

    // 5. اختبار API المعاملات
    console.log('\n5. 💰 اختبار API المعاملات...');
    
    // GET Transactions
    try {
      const transactionsResponse = await fetch(`${API_BASE}/transactions`);
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        results.transactions.get = true;
        console.log(`✅ جلب المعاملات: نجح (${transactionsData.length} معاملة)`);
      } else {
        console.log('❌ جلب المعاملات: فشل');
      }
    } catch (error) {
      console.log('❌ جلب المعاملات: خطأ في الاتصال');
    }

    // POST Transaction
    try {
      const newTransaction = {
        amount: 5000.00,
        type: 'income',
        description: 'معاملة تجريبية'
      };
      
      const createTransactionResponse = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
      });
      
      if (createTransactionResponse.ok) {
        const createdTransaction = await createTransactionResponse.json();
        results.transactions.post = true;
        console.log('✅ إنشاء معاملة: نجح');
        
        // PUT Transaction
        try {
          const updateData = { description: 'معاملة محدثة' };
          const updateResponse = await fetch(`${API_BASE}/transactions/${createdTransaction.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          });
          
          if (updateResponse.ok) {
            results.transactions.put = true;
            console.log('✅ تحديث معاملة: نجح');
          } else {
            console.log('❌ تحديث معاملة: فشل');
          }
        } catch (error) {
          console.log('❌ تحديث معاملة: خطأ في الاتصال');
        }
        
        // DELETE Transaction
        try {
          const deleteResponse = await fetch(`${API_BASE}/transactions/${createdTransaction.id}`, {
            method: 'DELETE'
          });
          
          if (deleteResponse.ok) {
            results.transactions.delete = true;
            console.log('✅ حذف معاملة: نجح');
          } else {
            console.log('❌ حذف معاملة: فشل');
          }
        } catch (error) {
          console.log('❌ حذف معاملة: خطأ في الاتصال');
        }
        
      } else {
        console.log('❌ إنشاء معاملة: فشل');
      }
    } catch (error) {
      console.log('❌ إنشاء معاملة: خطأ في الاتصال');
    }

    // 6. اختبار الإحصائيات
    console.log('\n6. 📊 اختبار الإحصائيات...');
    try {
      const statsResponse = await fetch(`${API_BASE}/statistics`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        results.statistics = true;
        console.log('✅ الإحصائيات: نجح');
        console.log(`   👥 المستخدمون: ${statsData.users}`);
        console.log(`   📊 المشاريع: ${statsData.projects}`);
        console.log(`   💰 المعاملات: ${statsData.transactions}`);
        console.log(`   💵 الإيرادات: ${statsData.totalIncome}`);
        console.log(`   💸 المصروفات: ${statsData.totalExpenses}`);
        console.log(`   📈 صافي الربح: ${statsData.netBalance}`);
      } else {
        console.log('❌ الإحصائيات: فشل');
      }
    } catch (error) {
      console.log('❌ الإحصائيات: خطأ في الاتصال');
    }

    // 7. النتائج النهائية
    console.log('\n' + '='.repeat(60));
    console.log('📋 تقرير الاختبار النهائي');
    console.log('='.repeat(60));

    const totalTests = Object.values(results).flat().length;
    const passedTests = Object.values(results).flat().filter(Boolean).length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log(`📊 معدل النجاح الإجمالي: ${successRate}% (${passedTests}/${totalTests})`);
    
    console.log('\n🔍 تفاصيل النتائج:');
    console.log(`   🏥 فحص الصحة: ${results.health ? '✅ نجح' : '❌ فشل'}`);
    console.log(`   🧪 Supabase: ${results.supabase ? '✅ نجح' : '❌ فشل'}`);
    console.log(`   📊 الإحصائيات: ${results.statistics ? '✅ نجح' : '❌ فشل'}`);
    
    console.log('\n👥 المستخدمون:');
    console.log(`   📄 قراءة: ${results.users.get ? '✅' : '❌'}`);
    console.log(`   ➕ إنشاء: ${results.users.post ? '✅' : '❌'}`);
    console.log(`   ✏️ تحديث: ${results.users.put ? '✅' : '❌'}`);
    console.log(`   🗑️ حذف: ${results.users.delete ? '✅' : '❌'}`);
    
    console.log('\n📊 المشاريع:');
    console.log(`   📄 قراءة: ${results.projects.get ? '✅' : '❌'}`);
    console.log(`   ➕ إنشاء: ${results.projects.post ? '✅' : '❌'}`);
    console.log(`   ✏️ تحديث: ${results.projects.put ? '✅' : '❌'}`);
    console.log(`   🗑️ حذف: ${results.projects.delete ? '✅' : '❌'}`);
    
    console.log('\n💰 المعاملات:');
    console.log(`   📄 قراءة: ${results.transactions.get ? '✅' : '❌'}`);
    console.log(`   ➕ إنشاء: ${results.transactions.post ? '✅' : '❌'}`);
    console.log(`   ✏️ تحديث: ${results.transactions.put ? '✅' : '❌'}`);
    console.log(`   🗑️ حذف: ${results.transactions.delete ? '✅' : '❌'}`);

    console.log('\n🎯 الخلاصة:');
    if (successRate >= 80) {
      console.log('🎉 النظام جاهز للنشر! جميع الوظائف الأساسية تعمل بشكل ممتاز.');
    } else if (successRate >= 60) {
      console.log('⚠️ النظام يحتاج إلى بعض الإصلاحات قبل النشر.');
    } else {
      console.log('❌ النظام يحتاج إلى إصلاحات كبيرة قبل النشر.');
    }
    
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ خطأ في تشغيل الاختبارات:', error);
  }
}

testAllFunctions();
