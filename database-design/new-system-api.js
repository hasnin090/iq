// 🔌 API النظام الجديد - المدير والمستخدمين
// =============================================

// ✅ 1. دوال مساعدة للتحقق من الصلاحيات
// =========================================

/**
 * التحقق من كون المستخدم مدير
 */
async function isAdmin(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  return data?.role === 'admin';
}

/**
 * التحقق من ربط المستخدم بمشروع معين
 */
async function isUserAssignedToProject(userId, projectId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .single();
  
  return !!data;
}

/**
 * جلب مشاريع المستخدم
 */
async function getUserProjects(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      user_roles!inner(user_id)
    `)
    .eq('user_roles.user_id', userId);
  
  return { data, error };
}

// ✅ 2. APIs للمدير
// ==================

/**
 * جلب جميع المشاريع (المدير فقط)
 */
async function getAllProjects(userId) {
  if (!(await isAdmin(userId))) {
    throw new Error('غير مصرح - المدير فقط');
  }
  
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      user_roles(
        id,
        user_id,
        profiles(full_name)
      )
    `)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

/**
 * إنشاء مشروع جديد (المدير فقط)
 */
async function createProject(userId, projectData) {
  if (!(await isAdmin(userId))) {
    throw new Error('غير مصرح - المدير فقط');
  }
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...projectData,
      created_by: userId
    })
    .select()
    .single();
  
  return { data, error };
}

/**
 * ربط مستخدم بمشروع (المدير فقط)
 */
async function assignUserToProject(adminId, userId, projectId) {
  if (!(await isAdmin(adminId))) {
    throw new Error('غير مصرح - المدير فقط');
  }
  
  const { data, error } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      project_id: projectId,
      role: 'assigned'
    })
    .select()
    .single();
  
  return { data, error };
}

/**
 * إلغاء ربط مستخدم من مشروع (المدير فقط)
 */
async function unassignUserFromProject(adminId, userId, projectId) {
  if (!(await isAdmin(adminId))) {
    throw new Error('غير مصرح - المدير فقط');
  }
  
  const { data, error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('project_id', projectId);
  
  return { data, error };
}

/**
 * إنشاء معاملة (المدير فقط)
 */
async function createTransaction(userId, transactionData) {
  if (!(await isAdmin(userId))) {
    throw new Error('غير مصرح - المدير فقط');
  }
  
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...transactionData,
      created_by: userId
    })
    .select()
    .single();
  
  return { data, error };
}

/**
 * إنشاء موظف (المدير فقط)
 */
async function createEmployee(userId, employeeData) {
  if (!(await isAdmin(userId))) {
    throw new Error('غير مصرح - المدير فقط');
  }
  
  const { data, error } = await supabase
    .from('employees')
    .insert({
      ...employeeData,
      created_by: userId
    })
    .select()
    .single();
  
  return { data, error };
}

// ✅ 3. APIs للمستخدم العادي
// ===========================

/**
 * جلب مشاريع المستخدم المرتبطة
 */
async function getMyProjects(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      user_roles!inner(user_id),
      employees(
        id, name, salary, active
      ),
      transactions(
        id, type, amount, date
      )
    `)
    .eq('user_roles.user_id', userId);
  
  return { data, error };
}

/**
 * جلب معاملات مشاريع المستخدم (قراءة فقط)
 */
async function getMyProjectTransactions(userId) {
  const { data, error } = await supabase
    .from('transaction_details')  // استخدام View
    .select('*')
    .in('project_id', 
      supabase
        .from('user_roles')
        .select('project_id')
        .eq('user_id', userId)
    )
    .order('date', { ascending: false });
  
  return { data, error };
}

/**
 * جلب موظفي مشاريع المستخدم (قراءة فقط)
 */
async function getMyProjectEmployees(userId) {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      projects(name)
    `)
    .in('assigned_project_id', 
      supabase
        .from('user_roles')
        .select('project_id')
        .eq('user_id', userId)
    );
  
  return { data, error };
}

/**
 * جلب مستحقات المستخدم
 */
async function getMyReceivables(userId) {
  const { data, error } = await supabase
    .from('receivable_summary')  // استخدام View
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

/**
 * إنشاء مستحق جديد
 */
async function createReceivable(userId, receivableData) {
  const { data, error } = await supabase
    .from('receivables')
    .insert({
      ...receivableData,
      created_by: userId
    })
    .select()
    .single();
  
  return { data, error };
}

/**
 * إضافة دفعة لمستحق
 */
async function addPaymentToReceivable(userId, paymentData) {
  // التحقق من ملكية المستحق
  const { data: receivable } = await supabase
    .from('receivables')
    .select('created_by')
    .eq('id', paymentData.receivable_id)
    .single();
  
  if (receivable?.created_by !== userId) {
    throw new Error('غير مصرح - ليس مستحقك');
  }
  
  const { data, error } = await supabase
    .from('receivable_payments')
    .insert({
      ...paymentData,
      created_by: userId
    })
    .select()
    .single();
  
  return { data, error };
}

/**
 * جلب مستندات المستخدم
 */
async function getMyDocuments(userId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

/**
 * رفع مستند جديد
 */
async function uploadDocument(userId, documentData) {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      ...documentData,
      created_by: userId
    })
    .select()
    .single();
  
  return { data, error };
}

// ✅ 4. APIs مشتركة
// ==================

/**
 * جلب بيانات المستخدم الحالي
 */
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { user: null, profile: null };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return { user, profile };
}

/**
 * إنشاء ملف شخصي للمستخدم الجديد
 */
async function createUserProfile(userId, profileData) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: profileData.full_name,
      role: 'user'  // المستخدمين الجدد عاديين بشكل افتراضي
    })
    .select()
    .single();
  
  return { data, error };
}

/**
 * تسجيل نشاط في السجل
 */
async function logActivity(userId, action, entityType, entityId, details) {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details
    });
  
  return { data, error };
}

// ✅ 5. APIs للإحصائيات
// ======================

/**
 * إحصائيات المدير (جميع البيانات)
 */
async function getAdminDashboardStats(userId) {
  if (!(await isAdmin(userId))) {
    throw new Error('غير مصرح - المدير فقط');
  }
  
  const [projects, transactions, users, employees] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact' }),
    supabase.from('transactions').select('id, amount, type'),
    supabase.from('profiles').select('id', { count: 'exact' }),
    supabase.from('employees').select('id', { count: 'exact' })
  ]);
  
  const totalIncome = transactions.data?.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  
  const totalExpenses = transactions.data?.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  
  return {
    projectsCount: projects.count,
    usersCount: users.count,
    employeesCount: employees.count,
    transactionsCount: transactions.data?.length || 0,
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses
  };
}

/**
 * إحصائيات المستخدم (مشاريعه فقط)
 */
async function getUserDashboardStats(userId) {
  const { data: userProjects } = await getUserProjects(userId);
  
  if (!userProjects?.length) {
    return {
      projectsCount: 0,
      totalBudget: 0,
      totalSpent: 0,
      documentsCount: 0,
      receivablesCount: 0
    };
  }
  
  const projectIds = userProjects.map(p => p.id);
  
  const [documents, receivables] = await Promise.all([
    supabase.from('documents').select('id', { count: 'exact' }).eq('created_by', userId),
    supabase.from('receivables').select('id', { count: 'exact' }).eq('created_by', userId)
  ]);
  
  const totalBudget = userProjects.reduce((sum, p) => sum + parseFloat(p.budget || 0), 0);
  const totalSpent = userProjects.reduce((sum, p) => sum + parseFloat(p.spent || 0), 0);
  
  return {
    projectsCount: userProjects.length,
    totalBudget,
    totalSpent,
    remainingBudget: totalBudget - totalSpent,
    documentsCount: documents.count || 0,
    receivablesCount: receivables.count || 0
  };
}

// ✅ 6. تصدير الدوال
// ===================

export {
  // دوال مساعدة
  isAdmin,
  isUserAssignedToProject,
  getCurrentUser,
  createUserProfile,
  logActivity,
  
  // APIs المدير
  getAllProjects,
  createProject,
  assignUserToProject,
  unassignUserFromProject,
  createTransaction,
  createEmployee,
  getAdminDashboardStats,
  
  // APIs المستخدم العادي
  getMyProjects,
  getMyProjectTransactions,
  getMyProjectEmployees,
  getMyReceivables,
  createReceivable,
  addPaymentToReceivable,
  getMyDocuments,
  uploadDocument,
  getUserDashboardStats
};
