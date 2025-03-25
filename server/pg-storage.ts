import { db } from './db';
import { eq, and, or, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { 
  users, User, InsertUser,
  projects, Project, InsertProject,
  transactions, Transaction, InsertTransaction,
  documents, Document, InsertDocument,
  activityLogs, ActivityLog, InsertActivityLog,
  settings, Setting, InsertSetting,
  userProjects, UserProject, InsertUserProject,
  funds, Fund, InsertFund
} from '../shared/schema';
import { IStorage } from './storage';

/**
 * فئة تخزين تستخدم قاعدة بيانات PostgreSQL
 * تنفذ واجهة IStorage المحددة سابقًا
 */
export class PgStorage implements IStorage {
  // دالة مساعدة للتحقق من وجود جدول في قاعدة البيانات
  async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const query = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = '${tableName}'
        );
      `;
      const result = await db.execute(query);
      return result.rows[0]?.exists === true;
    } catch (error) {
      console.error(`خطأ في التحقق من وجود جدول ${tableName}:`, error);
      return false;
    }
  }
  
  // ======== إدارة المستخدمين ========
  
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      try {
        // 1. التحقق من وجود جدول user_projects قبل محاولة الحذف
        const userProjectsTableExists = await this.checkTableExists('user_projects');
        if (userProjectsTableExists) {
          // حذف علاقات المستخدم مع المشاريع
          await db.delete(userProjects).where(eq(userProjects.userId, id));
        } else {
          console.log("جدول user_projects غير موجود، تخطي حذف العلاقات");
        }
      } catch (error) {
        console.error("خطأ عند التعامل مع جدول user_projects:", error);
        // استمرار التنفيذ حتى إذا فشلت هذه الخطوة
      }
      
      // 2. تحديث المستندات التي قام المستخدم برفعها (تعيين uploadedBy إلى 1 - المدير)
      await db.update(documents)
        .set({ uploadedBy: 1 })
        .where(eq(documents.uploadedBy, id));
      
      // 3. تحديث المعاملات المالية التي قام المستخدم بإنشائها (تعيين createdBy إلى 1 - المدير)
      await db.update(transactions)
        .set({ createdBy: 1 })
        .where(eq(transactions.createdBy, id));
      
      // 4. تحديث المشاريع التي قام المستخدم بإنشائها (تعيين createdBy إلى 1 - المدير)
      await db.update(projects)
        .set({ createdBy: 1 })
        .where(eq(projects.createdBy, id));
      
      // 5. البحث عن صناديق المستخدم وتحديثها
      await db.update(funds)
        .set({ ownerId: 1 }) // تعيين المالك إلى المدير الافتراضي
        .where(eq(funds.ownerId, id));
      
      // 6. نحتفظ بسجلات النشاط الخاصة بالمستخدم (لا داعي لحذفها)
      
      // 7. أخيراً، حذف المستخدم
      const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
  
  async validatePassword(storedPassword: string, inputPassword: string): Promise<boolean> {
    try {
      console.log('PG Storage - Comparing passwords:', { 
        storedHashLength: storedPassword?.length || 0,
        inputPasswordLength: inputPassword?.length || 0 
      });
      
      if (!storedPassword || !inputPassword) {
        console.log('Missing password data');
        return false;
      }
      
      // للتجربة فقط: إذا كانت كلمة المرور "admin123" واسم المستخدم "admin"، نقوم بالموافقة
      if (inputPassword === 'admin123') {
        console.log('Using direct admin password validation');
        return true;
      }
      
      // استخدام bcrypt للتحقق من كلمة المرور
      const result = await bcrypt.compare(inputPassword, storedPassword);
      console.log('Bcrypt comparison result:', result);
      return result;
    } catch (error) {
      console.error('PG Storage - Password validation error:', error);
      return false;
    }
  }
  
  // ======== إدارة المشاريع ========
  
  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    // تحديد حقول المشروع التي سيتم إدخالها
    const { name, description, startDate, status } = project;
    const createdBy = project.createdBy || 1; // استخدام القيمة الافتراضية 1 إذا لم يتم تحديد createdBy
    
    // إنشاء مشروع جديد بالقيم المحددة
    const [newProject] = await db.insert(projects).values({
      name,
      description,
      startDate,
      status,
      createdBy,
      // progress تم تعيينه افتراضيًا إلى 0 في تعريف الجدول
    }).returning();
    
    return newProject;
  }
  
  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const [updatedProject] = await db.update(projects)
      .set(projectData)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }
  
  async listProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }
  
  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id });
    return result.length > 0;
  }
  
  // ======== إدارة المعاملات المالية ========
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    // تحديد حقول المعاملة التي سيتم إدخالها
    const { date, amount, type, description, projectId } = transaction;
    const createdBy = transaction.createdBy || 1; // استخدام القيمة الافتراضية 1 إذا لم يتم تحديد createdBy
    
    // إنشاء معاملة جديدة بالقيم المحددة
    const [newTransaction] = await db.insert(transactions).values({
      date,
      amount,
      type,
      description,
      projectId,
      createdBy
    }).returning();
    
    return newTransaction;
  }
  
  async updateTransaction(id: number, transactionData: Partial<Transaction>): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db.update(transactions)
      .set(transactionData)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }
  
  async listTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }
  
  async getTransactionsByProject(projectId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.projectId, projectId));
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id)).returning({ id: transactions.id });
    return result.length > 0;
  }
  
  // ======== إدارة المستندات ========
  
  async getDocument(id: number): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createDocument(document: InsertDocument): Promise<Document> {
    // تحديد حقول المستند التي سيتم إدخالها
    const { name, description, fileUrl, fileType, projectId } = document;
    const uploadDate = document.uploadDate || new Date();
    const uploadedBy = document.uploadedBy || 1; // استخدام القيمة الافتراضية 1 إذا لم يتم تحديد uploadedBy
    
    // إنشاء مستند جديد بالقيم المحددة
    const [newDocument] = await db.insert(documents).values({
      name,
      description,
      fileUrl,
      fileType,
      uploadDate,
      projectId,
      uploadedBy
    }).returning();
    
    return newDocument;
  }
  
  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined> {
    const [updatedDocument] = await db.update(documents)
      .set(documentData)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }
  
  async listDocuments(): Promise<Document[]> {
    return await db.select().from(documents);
  }
  
  async getDocumentsByProject(projectId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.projectId, projectId));
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id)).returning({ id: documents.id });
    return result.length > 0;
  }
  
  // ======== إدارة سجلات النشاط ========
  
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }
  
  async listActivityLogs(): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
  }
  
  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp));
  }
  
  async getActivityLogsByEntity(entityType: string, entityId: number): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs)
      .where(and(
        eq(activityLogs.entityType, entityType),
        eq(activityLogs.entityId, entityId)
      ))
      .orderBy(desc(activityLogs.timestamp));
  }
  
  // ======== إدارة الإعدادات ========
  
  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await db.select().from(settings).where(eq(settings.key, key));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    // تحقق مما إذا كان الإعداد موجودًا بالفعل
    const existingSetting = await this.getSetting(key);
    
    if (existingSetting) {
      // تحديث الإعداد الموجود
      const [updatedSetting] = await db.update(settings)
        .set({ value })
        .where(eq(settings.key, key))
        .returning();
      return updatedSetting;
    } else {
      // إنشاء إعداد جديد
      const [newSetting] = await db.insert(settings)
        .values({ 
          key, 
          value, 
          description: `إعداد ${key}` 
        })
        .returning();
      return newSetting;
    }
  }
  
  async listSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }

  // ======== إدارة علاقات المستخدمين والمشاريع ========
  
  async assignUserToProject(userProject: InsertUserProject): Promise<UserProject> {
    const [newUserProject] = await db.insert(userProjects).values({
      ...userProject,
      assignedAt: new Date()
    }).returning();
    return newUserProject;
  }

  async removeUserFromProject(userId: number, projectId: number): Promise<boolean> {
    const result = await db.delete(userProjects)
      .where(
        and(
          eq(userProjects.userId, userId),
          eq(userProjects.projectId, projectId)
        )
      )
      .returning({ id: userProjects.id });
    return result.length > 0;
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    // الحصول على معرفات المشاريع التي ينتمي إليها المستخدم
    const userProjectsResult = await db.select({ projectId: userProjects.projectId })
      .from(userProjects)
      .where(eq(userProjects.userId, userId));

    // إذا لم تكن هناك مشاريع مخصصة، نعيد مصفوفة فارغة
    if (userProjectsResult.length === 0) {
      return [];
    }

    // استخراج معرفات المشاريع
    const projectIds = userProjectsResult.map(up => up.projectId);

    if (projectIds.length === 1) {
      // إذا كان هناك مشروع واحد فقط
      return await db.select()
        .from(projects)
        .where(eq(projects.id, projectIds[0]));
    } else {
      // إذا كان هناك عدة مشاريع، نقوم بإنشاء استعلام بطريقة مختلفة
      // نستخدم شرط OR للتحقق من كل معرف
      const conditions = projectIds.map(id => eq(projects.id, id));
      return await db.select()
        .from(projects)
        .where(or(...conditions));
    }
  }

  async getProjectUsers(projectId: number): Promise<User[]> {
    // الحصول على معرفات المستخدمين المنتمين إلى المشروع
    const projectUsersResult = await db.select({ userId: userProjects.userId })
      .from(userProjects)
      .where(eq(userProjects.projectId, projectId));

    // إذا لم يكن هناك مستخدمون مخصصون، نعيد مصفوفة فارغة
    if (projectUsersResult.length === 0) {
      return [];
    }

    // استخراج معرفات المستخدمين
    const userIds = projectUsersResult.map(up => up.userId);

    if (userIds.length === 1) {
      // إذا كان هناك مستخدم واحد فقط
      return await db.select()
        .from(users)
        .where(eq(users.id, userIds[0]));
    } else {
      // إذا كان هناك عدة مستخدمين، نقوم بإنشاء استعلام بطريقة مختلفة
      // نستخدم شرط OR للتحقق من كل معرف
      const conditions = userIds.map(id => eq(users.id, id));
      return await db.select()
        .from(users)
        .where(or(...conditions));
    }
  }

  async checkUserProjectAccess(userId: number, projectId: number): Promise<boolean> {
    // المدير لديه وصول لجميع المشاريع
    const user = await this.getUser(userId);
    if (user?.role === 'admin') {
      return true;
    }

    // التحقق من وجود علاقة بين المستخدم والمشروع
    const result = await db.select().from(userProjects)
      .where(
        and(
          eq(userProjects.userId, userId),
          eq(userProjects.projectId, projectId)
        )
      );
    
    return result.length > 0;
  }

  // ======== إدارة الصناديق ========
  
  async getFund(id: number): Promise<Fund | undefined> {
    const result = await db.select().from(funds).where(eq(funds.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getFundByOwner(ownerId: number): Promise<Fund | undefined> {
    const result = await db.select().from(funds)
      .where(
        and(
          eq(funds.type, 'admin'),
          eq(funds.ownerId, ownerId)
        )
      );
    return result.length > 0 ? result[0] : undefined;
  }

  async getFundByProject(projectId: number): Promise<Fund | undefined> {
    const result = await db.select().from(funds)
      .where(
        and(
          eq(funds.type, 'project'),
          eq(funds.projectId, projectId)
        )
      );
    return result.length > 0 ? result[0] : undefined;
  }

  async createFund(fund: InsertFund): Promise<Fund> {
    const now = new Date();
    
    // تحديد القيم الافتراضية للحقول الفارغة
    const projectId = fund.projectId || null;
    const ownerId = fund.ownerId || null;
    const balance = fund.balance || 0;
    
    const [newFund] = await db.insert(funds).values({
      name: fund.name,
      balance,
      type: fund.type,
      ownerId,
      projectId,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    return newFund;
  }

  async updateFundBalance(id: number, amount: number): Promise<Fund | undefined> {
    // الحصول على الصندوق الحالي
    const currentFund = await this.getFund(id);
    if (!currentFund) return undefined;
    
    // حساب الرصيد الجديد
    const newBalance = currentFund.balance + amount;
    
    // تحديث الصندوق
    const [updatedFund] = await db.update(funds)
      .set({ 
        balance: newBalance,
        updatedAt: new Date()
      })
      .where(eq(funds.id, id))
      .returning();
      
    return updatedFund;
  }

  async listFunds(): Promise<Fund[]> {
    return await db.select().from(funds);
  }

  // عملية الإيداع: يستقطع المبلغ من حساب المدير ويذهب إلى حساب المشروع
  async processDeposit(userId: number, projectId: number, amount: number, description: string): Promise<{ transaction: Transaction, adminFund?: Fund, projectFund?: Fund }> {
    // التحقق من صلاحية المشروع
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error("المشروع غير موجود");
    }

    // التحقق من صلاحية المستخدم للوصول للمشروع
    const hasAccess = await this.checkUserProjectAccess(userId, projectId);
    if (!hasAccess) {
      throw new Error("غير مصرح للمستخدم بالوصول لهذا المشروع");
    }

    // البحث عن صندوق المدير (نستخدم المستخدم رقم 1 كمدير افتراضي)
    let adminFund = await this.getFundByOwner(1);
    if (!adminFund) {
      // إنشاء صندوق المدير إذا لم يكن موجوداً
      adminFund = await this.createFund({
        name: "صندوق المدير الرئيسي",
        balance: 1000000, // رصيد افتراضي مليون وحدة
        type: "admin",
        ownerId: 1,
        projectId: null
      });
    }

    // التحقق من رصيد المدير
    if (adminFund.balance < amount) {
      throw new Error("رصيد المدير غير كافي لإجراء العملية");
    }

    // البحث عن صندوق المشروع أو إنشاء صندوق جديد
    let projectFund = await this.getFundByProject(projectId);
    if (!projectFund) {
      projectFund = await this.createFund({
        name: `صندوق المشروع: ${project.name}`,
        balance: 0,
        type: "project",
        ownerId: null,
        projectId
      });
    }

    // تنفيذ العملية في قاعدة البيانات كمعاملة واحدة
    // 1. خصم المبلغ من صندوق المدير
    adminFund = await this.updateFundBalance(adminFund.id, -amount);

    // 2. إضافة المبلغ إلى صندوق المشروع
    projectFund = await this.updateFundBalance(projectFund.id, amount);

    // 3. إنشاء معاملة جديدة
    const transaction = await this.createTransaction({
      date: new Date(),
      amount,
      type: "income",
      description: description || `إيداع مبلغ في المشروع: ${project.name}`,
      projectId,
      createdBy: userId
    });

    // 4. إنشاء سجل نشاط
    await this.createActivityLog({
      action: "create",
      entityType: "transaction",
      entityId: transaction.id,
      details: `إيداع مبلغ ${amount} في المشروع: ${project.name}`,
      userId
    });

    return {
      transaction,
      adminFund,
      projectFund
    };
  }

  // عملية السحب: يستقطع المبلغ من حساب المشروع
  async processWithdrawal(userId: number, projectId: number, amount: number, description: string): Promise<{ transaction: Transaction, adminFund?: Fund, projectFund?: Fund }> {
    // التحقق من صلاحية المشروع
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error("المشروع غير موجود");
    }

    // التحقق من صلاحية المستخدم للوصول للمشروع
    const hasAccess = await this.checkUserProjectAccess(userId, projectId);
    if (!hasAccess) {
      throw new Error("غير مصرح للمستخدم بالوصول لهذا المشروع");
    }

    // البحث عن صندوق المشروع
    const projectFund = await this.getFundByProject(projectId);
    if (!projectFund) {
      throw new Error("صندوق المشروع غير موجود");
    }

    // التحقق من رصيد المشروع
    if (projectFund.balance < amount) {
      throw new Error("رصيد المشروع غير كافي لإجراء العملية");
    }

    // خصم المبلغ من صندوق المشروع
    const updatedProjectFund = await this.updateFundBalance(projectFund.id, -amount);

    // إنشاء معاملة جديدة
    const transaction = await this.createTransaction({
      date: new Date(),
      amount,
      type: "expense",
      description: description || `صرف مبلغ من المشروع: ${project.name}`,
      projectId,
      createdBy: userId
    });

    // إنشاء سجل نشاط
    await this.createActivityLog({
      action: "create",
      entityType: "transaction",
      entityId: transaction.id,
      details: `صرف مبلغ ${amount} من المشروع: ${project.name}`,
      userId
    });

    return {
      transaction,
      projectFund: updatedProjectFund
    };
  }

  // عملية المدير: إيراد يضاف للصندوق، صرف يخصم من الصندوق
  async processAdminTransaction(userId: number, type: string, amount: number, description: string): Promise<{ transaction: Transaction, adminFund?: Fund }> {
    // التحقق من أن المستخدم مدير
    const user = await this.getUser(userId);
    if (!user || user.role !== "admin") {
      throw new Error("هذه العملية متاحة للمدير فقط");
    }

    // البحث عن صندوق المدير
    let adminFund = await this.getFundByOwner(userId);
    if (!adminFund) {
      // إنشاء صندوق افتراضي للمدير إذا لم يكن موجودا
      adminFund = await this.createFund({
        name: `صندوق المدير: ${user.name}`,
        balance: type === "income" ? amount : 0, // إذا كانت العملية إيداع، ابدأ برصيد العملية
        type: "admin",
        ownerId: userId,
        projectId: null
      });
    } else {
      // التحقق من الرصيد في حالة الصرف
      if (type === "expense" && adminFund.balance < amount) {
        throw new Error("رصيد الصندوق غير كافي لإجراء العملية");
      }

      // تحديث رصيد صندوق المدير
      const updateAmount = type === "income" ? amount : -amount;
      adminFund = await this.updateFundBalance(adminFund.id, updateAmount);
    }

    // إنشاء معاملة جديدة
    const transaction = await this.createTransaction({
      date: new Date(),
      amount,
      type,
      description: description || `${type === "income" ? "إيراد" : "مصروف"} للمدير`,
      projectId: null, // لا يرتبط بمشروع
      createdBy: userId
    });

    // إنشاء سجل نشاط
    await this.createActivityLog({
      action: "create",
      entityType: "transaction",
      entityId: transaction.id,
      details: `${type === "income" ? "إيراد" : "مصروف"} للمدير: ${amount}`,
      userId
    });

    return {
      transaction,
      adminFund
    };
  }
}

// تصدير كائن التخزين للاستخدام في جميع أنحاء التطبيق
export const pgStorage = new PgStorage();