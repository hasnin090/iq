const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function createBackup() {
  const sql = neon(process.env.DATABASE_URL);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  console.log('🔄 بدء إنشاء النسخة الاحتياطية...');
  
  try {
    // المعاملات
    const transactions = await sql(`
      SELECT t.*, p.name as project_name, u.name as created_by_name
      FROM transactions t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.id
    `);
    
    // المشاريع
    const projects = await sql(`SELECT * FROM projects ORDER BY id`);
    
    // المستخدمين (بدون كلمات مرور)
    const users = await sql(`
      SELECT id, username, name, email, role, permissions 
      FROM users ORDER BY id
    `);
    
    // أنواع المصروفات
    const expenseTypes = await sql(`SELECT * FROM expense_types ORDER BY id`);
    
    // الموظفين
    const employees = await sql(`SELECT * FROM employees ORDER BY id`);
    
    // الإعدادات
    const settings = await sql(`SELECT * FROM settings ORDER BY id`);
    
    const backupData = {
      metadata: {
        created_at: new Date().toISOString(),
        timestamp,
        total_records: transactions.length + projects.length + users.length + expenseTypes.length + employees.length + settings.length,
        system_version: '1.0'
      },
      transactions: {
        count: transactions.length,
        data: transactions
      },
      projects: {
        count: projects.length,
        data: projects
      },
      users: {
        count: users.length,
        data: users,
        note: 'Passwords excluded for security'
      },
      expense_types: {
        count: expenseTypes.length,
        data: expenseTypes
      },
      employees: {
        count: employees.length,
        data: employees
      },
      settings: {
        count: settings.length,
        data: settings
      }
    };
    
    const fileName = `complete-backup-${timestamp}.json`;
    fs.writeFileSync(`cloud-backup/${fileName}`, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ تم إنشاء النسخة الاحتياطية: ${fileName}`);
    console.log(`📊 إجمالي السجلات: ${backupData.metadata.total_records}`);
    console.log(`📁 المعاملات: ${transactions.length}`);
    console.log(`🏗️ المشاريع: ${projects.length}`);
    console.log(`👤 المستخدمين: ${users.length}`);
    console.log(`💰 أنواع المصروفات: ${expenseTypes.length}`);
    console.log(`👷 الموظفين: ${employees.length}`);
    console.log(`⚙️ الإعدادات: ${settings.length}`);
    
    return { success: true, fileName, totalRecords: backupData.metadata.total_records };
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
    return { success: false, error: error.message };
  }
}

createBackup().then(result => {
  if (result.success) {
    console.log(`🎉 تمت العملية بنجاح - ${result.totalRecords} سجل`);
  } else {
    console.log(`💥 فشلت العملية: ${result.error}`);
  }
  process.exit(result.success ? 0 : 1);
});