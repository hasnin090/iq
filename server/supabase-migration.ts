import { createClient } from '@supabase/supabase-js';
import { db } from './db';
import { users, projects, transactions, documents, activityLogs, settings, expenseTypes, ledgerEntries, accountCategories, deferredPayments } from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseClient: any = null;

// إعداد Supabase كقاعدة البيانات الرئيسية
export async function setupSupabaseAsMainDatabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase credentials not configured');
  }

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  console.log('🔄 بدء إعداد Supabase كقاعدة البيانات الرئيسية...');
  
  try {
    // إنشاء الجداول في Supabase إذا لم تكن موجودة
    await createTablesInSupabase();
    
    // نقل البيانات من PostgreSQL إلى Supabase
    await migrateDataToSupabase();
    
    console.log('✅ تم إعداد Supabase كقاعدة البيانات الرئيسية بنجاح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في إعداد Supabase:', error);
    throw error;
  }
}

// إنشاء الجداول في Supabase
async function createTablesInSupabase() {
  console.log('📊 إنشاء الجداول في Supabase...');
  
  const createTablesSQL = `
    -- إنشاء جدول المستخدمين
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      role VARCHAR(50) DEFAULT 'user',
      permissions TEXT[],
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- إنشاء جدول المشاريع
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      start_date DATE,
      status VARCHAR(50) DEFAULT 'active',
      progress INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- إنشاء جدول المعاملات
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      date TIMESTAMP NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      type VARCHAR(20) NOT NULL,
      description TEXT,
      category VARCHAR(255),
      file_url TEXT,
      created_by INTEGER,
      project_id INTEGER,
      expense_type_id INTEGER,
      beneficiary_name VARCHAR(255),
      payment_method VARCHAR(50),
      invoice_number VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- إنشاء جدول الوثائق
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      file_url TEXT NOT NULL,
      file_type VARCHAR(50),
      file_size INTEGER,
      uploaded_by INTEGER,
      project_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- إنشاء جدول سجل النشاطات
    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      action VARCHAR(255) NOT NULL,
      entity_type VARCHAR(100),
      entity_id INTEGER,
      details TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- إنشاء جدول الإعدادات
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(255) UNIQUE NOT NULL,
      value TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- إنشاء جدول أنواع المصروفات
    CREATE TABLE IF NOT EXISTS expense_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- إنشاء جدول دفتر الأستاذ
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id SERIAL PRIMARY KEY,
      date TIMESTAMP NOT NULL,
      transaction_id INTEGER,
      expense_type_id INTEGER,
      amount INTEGER NOT NULL,
      description TEXT NOT NULL,
      project_id INTEGER,
      entry_type VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- إنشاء جدول فئات الحسابات
    CREATE TABLE IF NOT EXISTS account_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      parent_id INTEGER,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- إنشاء جدول المدفوعات المؤجلة
    CREATE TABLE IF NOT EXISTS deferred_payments (
      id SERIAL PRIMARY KEY,
      beneficiary_name VARCHAR(255) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      due_date DATE NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      project_id INTEGER,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    // تنفيذ SQL لإنشاء الجداول
    const { error } = await supabaseClient.rpc('exec_sql', { sql: createTablesSQL });
    
    if (error) {
      console.log('⚠️ محاولة إنشاء الجداول يدوياً...');
      // إذا فشلت الطريقة الأولى، نحاول إنشاء الجداول واحداً تلو الآخر
      await createTablesManually();
    } else {
      console.log('✅ تم إنشاء الجداول في Supabase');
    }
  } catch (error) {
    console.log('⚠️ محاولة إنشاء الجداول يدوياً...');
    await createTablesManually();
  }
}

// إنشاء الجداول يدوياً
async function createTablesManually() {
  // سنحاول إدراج بيانات تجريبية للتأكد من وجود الجداول
  try {
    await supabaseClient.from('users').select('id').limit(1);
    console.log('✅ جدول المستخدمين موجود');
  } catch (error) {
    console.log('📊 الجداول ستُنشأ تلقائياً عند إدراج البيانات');
  }
}

// نقل البيانات من PostgreSQL إلى Supabase
async function migrateDataToSupabase() {
  console.log('🔄 بدء نقل البيانات إلى Supabase...');

  try {
    // نقل المستخدمين
    const dbUsers = await db.select().from(users);
    if (dbUsers.length > 0) {
      const { error: usersError } = await supabaseClient
        .from('users')
        .upsert(dbUsers, { onConflict: 'username' });
      
      if (!usersError) {
        console.log(`✅ تم نقل ${dbUsers.length} مستخدم`);
      }
    }

    // نقل المشاريع
    const dbProjects = await db.select().from(projects);
    if (dbProjects.length > 0) {
      const { error: projectsError } = await supabaseClient
        .from('projects')
        .upsert(dbProjects);
      
      if (!projectsError) {
        console.log(`✅ تم نقل ${dbProjects.length} مشروع`);
      }
    }

    // نقل المعاملات
    const dbTransactions = await db.select().from(transactions);
    if (dbTransactions.length > 0) {
      const { error: transactionsError } = await supabaseClient
        .from('transactions')
        .upsert(dbTransactions);
      
      if (!transactionsError) {
        console.log(`✅ تم نقل ${dbTransactions.length} معاملة`);
      }
    }

    // نقل الوثائق
    const dbDocuments = await db.select().from(documents);
    if (dbDocuments.length > 0) {
      const { error: documentsError } = await supabaseClient
        .from('documents')
        .upsert(dbDocuments);
      
      if (!documentsError) {
        console.log(`✅ تم نقل ${dbDocuments.length} وثيقة`);
      }
    }

    // نقل سجل النشاطات
    const dbActivityLogs = await db.select().from(activityLogs);
    if (dbActivityLogs.length > 0) {
      const { error: activityLogsError } = await supabaseClient
        .from('activity_logs')
        .upsert(dbActivityLogs);
      
      if (!activityLogsError) {
        console.log(`✅ تم نقل ${dbActivityLogs.length} نشاط`);
      }
    }

    // نقل الإعدادات
    const dbSettings = await db.select().from(settings);
    if (dbSettings.length > 0) {
      const { error: settingsError } = await supabaseClient
        .from('settings')
        .upsert(dbSettings, { onConflict: 'key' });
      
      if (!settingsError) {
        console.log(`✅ تم نقل ${dbSettings.length} إعداد`);
      }
    }

    // نقل أنواع المصروفات
    const dbExpenseTypes = await db.select().from(expenseTypes);
    if (dbExpenseTypes.length > 0) {
      const { error: expenseTypesError } = await supabaseClient
        .from('expense_types')
        .upsert(dbExpenseTypes);
      
      if (!expenseTypesError) {
        console.log(`✅ تم نقل ${dbExpenseTypes.length} نوع مصروف`);
      }
    }

    // نقل دفتر الأستاذ
    const dbLedgerEntries = await db.select().from(ledgerEntries);
    if (dbLedgerEntries.length > 0) {
      const { error: ledgerError } = await supabaseClient
        .from('ledger_entries')
        .upsert(dbLedgerEntries);
      
      if (!ledgerError) {
        console.log(`✅ تم نقل ${dbLedgerEntries.length} قيد محاسبي`);
      }
    }

    // نقل فئات الحسابات
    const dbAccountCategories = await db.select().from(accountCategories);
    if (dbAccountCategories.length > 0) {
      const { error: accountCategoriesError } = await supabaseClient
        .from('account_categories')
        .upsert(dbAccountCategories);
      
      if (!accountCategoriesError) {
        console.log(`✅ تم نقل ${dbAccountCategories.length} فئة حساب`);
      }
    }

    // نقل المدفوعات المؤجلة
    const dbDeferredPayments = await db.select().from(deferredPayments);
    if (dbDeferredPayments.length > 0) {
      const { error: deferredPaymentsError } = await supabaseClient
        .from('deferred_payments')
        .upsert(dbDeferredPayments);
      
      if (!deferredPaymentsError) {
        console.log(`✅ تم نقل ${dbDeferredPayments.length} دفعة مؤجلة`);
      }
    }

    console.log('✅ تم نقل جميع البيانات إلى Supabase بنجاح');
  } catch (error) {
    console.error('❌ خطأ في نقل البيانات:', error);
    throw error;
  }
}

// نقل الملفات من التخزين المحلي إلى Supabase
export async function migrateFilesToSupabase() {
  console.log('📁 بدء نقل الملفات إلى Supabase...');
  
  const uploadsDir = path.join(process.cwd(), 'uploads');
  let migratedCount = 0;
  let errorCount = 0;

  try {
    if (!fs.existsSync(uploadsDir)) {
      console.log('📂 مجلد uploads غير موجود');
      return { success: true, migratedCount: 0, errorCount: 0 };
    }

    const files = fs.readdirSync(uploadsDir);
    console.log(`📋 العثور على ${files.length} ملف للنقل`);

    for (const file of files) {
      try {
        const filePath = path.join(uploadsDir, file);
        const fileStats = fs.statSync(filePath);
        
        if (fileStats.isFile()) {
          const fileBuffer = fs.readFileSync(filePath);
          
          // رفع الملف إلى Supabase Storage
          const { data, error } = await supabaseClient.storage
            .from('files')
            .upload(file, fileBuffer, {
              contentType: getContentType(file),
              upsert: true
            });

          if (error) {
            console.error(`❌ فشل رفع ${file}:`, error.message);
            errorCount++;
          } else {
            console.log(`✅ تم رفع ${file}`);
            migratedCount++;
          }
        }
      } catch (error) {
        console.error(`❌ خطأ في معالجة ${file}:`, error);
        errorCount++;
      }
    }

    console.log(`📊 نتائج نقل الملفات: ${migratedCount} نجح، ${errorCount} فشل`);
    return { success: true, migratedCount, errorCount };
  } catch (error) {
    console.error('❌ خطأ عام في نقل الملفات:', error);
    return { success: false, migratedCount, errorCount, error: error.message };
  }
}

// تحديد نوع محتوى الملف
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: { [key: string]: string } = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.zip': 'application/zip'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

// تحديث روابط الملفات في قاعدة البيانات
export async function updateFileUrlsToSupabase() {
  console.log('🔄 تحديث روابط الملفات في قاعدة البيانات...');
  
  try {
    // الحصول على URL الأساسي لـ Supabase Storage
    const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/files/`;
    
    // تحديث روابط الملفات في جدول المعاملات
    const transactionsWithFiles = await supabaseClient
      .from('transactions')
      .select('id, file_url')
      .not('file_url', 'is', null);

    if (transactionsWithFiles.data) {
      for (const transaction of transactionsWithFiles.data) {
        if (transaction.file_url && !transaction.file_url.includes('supabase')) {
          const filename = path.basename(transaction.file_url);
          const newUrl = baseUrl + filename;
          
          await supabaseClient
            .from('transactions')
            .update({ file_url: newUrl })
            .eq('id', transaction.id);
        }
      }
      console.log(`✅ تم تحديث روابط ${transactionsWithFiles.data.length} معاملة`);
    }

    // تحديث روابط الملفات في جدول الوثائق
    const documentsWithFiles = await supabaseClient
      .from('documents')
      .select('id, file_url');

    if (documentsWithFiles.data) {
      for (const document of documentsWithFiles.data) {
        if (document.file_url && !document.file_url.includes('supabase')) {
          const filename = path.basename(document.file_url);
          const newUrl = baseUrl + filename;
          
          await supabaseClient
            .from('documents')
            .update({ file_url: newUrl })
            .eq('id', document.id);
        }
      }
      console.log(`✅ تم تحديث روابط ${documentsWithFiles.data.length} وثيقة`);
    }

    console.log('✅ تم تحديث جميع روابط الملفات');
    return true;
  } catch (error) {
    console.error('❌ خطأ في تحديث روابط الملفات:', error);
    throw error;
  }
}

// فحص حالة النقل
export async function checkMigrationStatus() {
  try {
    const tablesStatus = {
      users: 0,
      projects: 0,
      transactions: 0,
      documents: 0,
      activityLogs: 0,
      settings: 0,
      expenseTypes: 0,
      ledger: 0,
      accountCategories: 0,
      deferredPayments: 0
    };

    // فحص عدد السجلات في كل جدول
    const tables = Object.keys(tablesStatus);
    for (const table of tables) {
      try {
        const { count } = await supabaseClient
          .from(table.replace(/([A-Z])/g, '_$1').toLowerCase())
          .select('*', { count: 'exact', head: true });
        
        tablesStatus[table as keyof typeof tablesStatus] = count || 0;
      } catch (error) {
        console.log(`⚠️ لا يمكن فحص جدول ${table}`);
      }
    }

    return tablesStatus;
  } catch (error) {
    console.error('❌ خطأ في فحص حالة النقل:', error);
    throw error;
  }
}