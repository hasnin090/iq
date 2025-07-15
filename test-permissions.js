// 🧪 اختبار سريع لنظام الصلاحيات - Node.js
// ===============================================

// محاكاة البيانات والوظائف
const PERMISSION_GROUPS = {
  ADMIN: [
    'view_dashboard', 'view_reports', 'export_data', 'view_projects', 
    'create_project', 'edit_project', 'delete_project', 'manage_project_users',
    'view_transactions', 'create_transaction', 'edit_transaction', 'delete_transaction',
    'approve_transaction', 'view_users', 'create_user', 'edit_user', 'delete_user',
    'manage_users', 'assign_permissions', 'view_employees', 'create_employee',
    'edit_employee', 'delete_employee', 'manage_salaries', 'view_documents',
    'upload_document', 'edit_document', 'delete_document', 'manage_documents',
    'view_receivables', 'create_receivable', 'edit_receivable', 'delete_receivable',
    'manage_payments', 'view_settings', 'edit_settings', 'manage_system',
    'view_activity_logs', 'backup_system', 'view_ledger', 'edit_ledger',
    'close_period', 'generate_reports'
  ],
  MANAGER: [
    'view_dashboard', 'view_reports', 'export_data', 'view_projects',
    'create_project', 'edit_project', 'manage_project_users', 'view_transactions',
    'create_transaction', 'edit_transaction', 'approve_transaction', 'view_users',
    'view_employees', 'create_employee', 'edit_employee', 'manage_salaries',
    'view_documents', 'upload_document', 'edit_document', 'view_receivables',
    'create_receivable', 'edit_receivable', 'manage_payments', 'view_settings',
    'view_ledger', 'generate_reports'
  ],
  USER: [
    'view_dashboard', 'view_projects', 'view_transactions', 'create_transaction',
    'view_employees', 'view_documents', 'upload_document', 'view_receivables',
    'create_receivable', 'manage_payments'
  ],
  VIEWER: [
    'view_dashboard', 'view_projects', 'view_transactions', 'view_employees',
    'view_documents', 'view_receivables'
  ]
};

// بيانات المستخدمين للاختبار
const testUsers = [
  {
    id: '1',
    full_name: 'أحمد المدير العام',
    role: 'admin',
    permissions: PERMISSION_GROUPS.ADMIN,
    project_ids: ['proj-1', 'proj-2', 'proj-3']
  },
  {
    id: '2',
    full_name: 'فاطمة المديرة',
    role: 'manager',
    permissions: PERMISSION_GROUPS.MANAGER,
    project_ids: ['proj-1', 'proj-2']
  },
  {
    id: '3',
    full_name: 'محمد المستخدم',
    role: 'user',
    permissions: PERMISSION_GROUPS.USER,
    project_ids: ['proj-1']
  },
  {
    id: '4',
    full_name: 'سارة المشاهدة',
    role: 'viewer',
    permissions: PERMISSION_GROUPS.VIEWER,
    project_ids: ['proj-1']
  }
];

// وظائف فحص الصلاحيات
function hasPermission(userProfile, permission) {
  if (!userProfile) return false;
  if (userProfile.role === 'admin') return true;
  return userProfile.permissions.includes(permission);
}

function hasAnyPermission(userProfile, permissions) {
  if (!userProfile) return false;
  if (userProfile.role === 'admin') return true;
  return permissions.some(permission => userProfile.permissions.includes(permission));
}

function canAccessProject(userProfile, projectId) {
  if (!userProfile) return false;
  if (userProfile.role === 'admin' || userProfile.role === 'manager') return true;
  return userProfile.project_ids?.includes(projectId) || false;
}

// تشغيل الاختبارات
function runTests() {
  console.log('🧪 بدء اختبار نظام الصلاحيات...\n');
  
  let passedTests = 0;
  let totalTests = 0;

  function test(description, expected, actual) {
    totalTests++;
    const passed = actual === expected;
    if (passed) passedTests++;
    
    console.log(`${passed ? '✅' : '❌'} ${description}`);
    console.log(`   متوقع: ${expected} | فعلي: ${actual}\n`);
    
    return passed;
  }

  // اختبار المدير العام
  const admin = testUsers[0];
  test('المدير العام يملك صلاحية إدارة النظام', true, hasPermission(admin, 'manage_system'));
  test('المدير العام يملك صلاحية حذف المشاريع', true, hasPermission(admin, 'delete_project'));
  test('المدير العام يصل لجميع المشاريع', true, canAccessProject(admin, 'proj-999'));

  // اختبار المدير
  const manager = testUsers[1];
  test('المدير يملك صلاحية إنشاء مشاريع', true, hasPermission(manager, 'create_project'));
  test('المدير لا يملك صلاحية إدارة النظام', false, hasPermission(manager, 'manage_system'));
  test('المدير يصل للمشاريع المخصصة', true, canAccessProject(manager, 'proj-1'));

  // اختبار المستخدم
  const user = testUsers[2];
  test('المستخدم يملك صلاحية عرض المشاريع', true, hasPermission(user, 'view_projects'));
  test('المستخدم لا يملك صلاحية حذف المشاريع', false, hasPermission(user, 'delete_project'));
  test('المستخدم لا يصل للمشاريع غير المخصصة', false, canAccessProject(user, 'proj-3'));

  // اختبار المشاهد
  const viewer = testUsers[3];
  test('المشاهد يملك صلاحية عرض المستندات', true, hasPermission(viewer, 'view_documents'));
  test('المشاهد لا يملك صلاحية رفع المستندات', false, hasPermission(viewer, 'upload_document'));
  test('المشاهد لا يملك صلاحية إنشاء معاملات', false, hasPermission(viewer, 'create_transaction'));

  // اختبار الصلاحيات المتعددة
  test('المدير يملك صلاحيات متعددة', true, hasAnyPermission(manager, ['view_projects', 'create_project']));
  test('المشاهد لا يملك صلاحيات إدارية', false, hasAnyPermission(viewer, ['delete_project', 'manage_users']));

  // النتائج النهائية
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log('='.repeat(50));
  console.log(`📊 نتائج الاختبار:`);
  console.log(`✅ نجح: ${passedTests}`);
  console.log(`❌ فشل: ${totalTests - passedTests}`);
  console.log(`📈 معدل النجاح: ${successRate}%`);
  
  if (successRate === 100) {
    console.log('🎉 جميع الاختبارات نجحت! النظام يعمل بشكل مثالي.');
  } else if (successRate >= 80) {
    console.log('⚠️ معظم الاختبارات نجحت، لكن هناك بعض المشاكل.');
  } else {
    console.log('🚨 فشل في عدة اختبارات، يحتاج مراجعة.');
  }
  
  console.log('='.repeat(50));
  
  // عرض معلومات المستخدمين
  console.log('\n👥 معلومات المستخدمين المتاحين:');
  testUsers.forEach(user => {
    console.log(`📋 ${user.full_name}:`);
    console.log(`   - الدور: ${user.role}`);
    console.log(`   - عدد الصلاحيات: ${user.permissions.length}`);
    console.log(`   - المشاريع: ${user.project_ids.length}`);
    console.log('');
  });
}

// تشغيل الاختبارات
runTests();

// لا حاجة لـ module.exports في ES modules
