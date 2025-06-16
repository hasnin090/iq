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
    // تشفير كلمة المرور قبل حفظها
    if (user.password) {
      user.password = await this.hashPassword(user.password);
    }
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    // تشفير كلمة المرور الجديدة إذا تم تحديثها
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }
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
      // 1. التعامل مع علاقات المستخدم مع المشاريع
      try {
        const userProjectsExists = await db.execute(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'user_projects'
          );
        `);
        const exists = userProjectsExists.rows[0]?.exists === true;
        
        if (exists) {
          console.log("جدول user_projects موجود، جاري حذف علاقات المستخدم");
          await db.delete(userProjects).where(eq(userProjects.userId, id));
        } else {
          console.log("جدول user_projects غير موجود، تخطي حذف العلاقات");
        }
      } catch (error) {
        console.error("خطأ عند التعامل مع جدول user_projects:", error);
        // استمرار التنفيذ حتى إذا فشلت هذه الخطوة
      }
      
      // 2. تحديث المستندات التي قام المستخدم برفعها
      try {
        const documentsExists = await db.execute(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'documents'
          );
        `);
        const exists = documentsExists.rows[0]?.exists === true;
        
        if (exists) {
          console.log("جدول documents موجود، جاري تحديث المستندات");
          await db.update(documents)
            .set({ uploadedBy: 1 })
            .where(eq(documents.uploadedBy, id));
        } else {
          console.log("جدول documents غير موجود، تخطي تحديث المستندات");
        }
      } catch (error) {
        console.error("خطأ عند التعامل مع جدول documents:", error);
      }
      
      // 3. تحديث المعاملات المالية التي قام المستخدم بإنشائها
      try {
        const transactionsExists = await db.execute(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'transactions'
          );
        `);
        const exists = transactionsExists.rows[0]?.exists === true;
        
        if (exists) {
          console.log("جدول transactions موجود، جاري تحديث المعاملات");
          await db.update(transactions)
            .set({ createdBy: 1 })
            .where(eq(transactions.createdBy, id));
        } else {
          console.log("جدول transactions غير موجود، تخطي تحديث المعاملات");
        }
      } catch (error) {
        console.error("خطأ عند التعامل مع جدول transactions:", error);
      }
      
      // 4. تحديث المشاريع التي قام المستخدم بإنشائها
      try {
        const projectsExists = await db.execute(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'projects'
          );
        `);
        const exists = projectsExists.rows[0]?.exists === true;
        
        if (exists) {
          console.log("جدول projects موجود، جاري تحديث المشاريع");
          await db.update(projects)
            .set({ createdBy: 1 })
            .where(eq(projects.createdBy, id));
        } else {
          console.log("جدول projects غير موجود، تخطي تحديث المشاريع");
        }
      } catch (error) {
        console.error("خطأ عند التعامل مع جدول projects:", error);
      }
      
      // 5. تحديث صناديق المستخدم
      try {
        const fundsExists = await db.execute(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'funds'
          );
        `);
        const exists = fundsExists.rows[0]?.exists === true;
        
        if (exists) {
          console.log("جدول funds موجود، جاري تحديث الصناديق");
          await db.update(funds)
            .set({ ownerId: 1 }) // تعيين المالك إلى المدير الافتراضي
            .where(eq(funds.ownerId, id));
        } else {
          console.log("جدول funds غير موجود، تخطي تحديث الصناديق");
        }
      } catch (error) {
        console.error("خطأ عند التعامل مع جدول funds:", error);
      }
      
      // 6. تحديث سجلات النشاط المرتبطة بالمستخدم
      try {
        const activityLogsExists = await db.execute(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'activity_logs'
          );
        `);
        const exists = activityLogsExists.rows[0]?.exists === true;
        
        if (exists) {
          console.log("جدول activity_logs موجود، جاري تحديث سجلات النشاط");
          await db.update(activityLogs)
            .set({ userId: 1 }) // تعيين المستخدم إلى المدير الافتراضي
            .where(eq(activityLogs.userId, id));
        } else {
          console.log("جدول activity_logs غير موجود، تخطي تحديث سجلات النشاط");
        }
      } catch (error) {
        console.error("خطأ عند التعامل مع جدول activity_logs:", error);
      }
      
      // 7. أخيراً، حذف المستخدم
      const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
      return result.length > 0;
    } catch (error) {
      console.error("خطأ في حذف المستخدم:", error);
      throw error;
    }
  }
  
  async validatePassword(storedPassword: string, inputPassword: string): Promise<boolean> {
    try {
      if (!storedPassword || !inputPassword) {
        return false;
      }
      
      // تحقق من قوة كلمة المرور (8 أحرف على الأقل)
      if (inputPassword.length < 8) {
        return false;
      }
      
      // استخدام bcrypt للتحقق من كلمة المرور مع مستوى تشفير عالي
      const result = await bcrypt.compare(inputPassword, storedPassword);
      return result;
    } catch (error) {
      console.error('Password validation error:', error);
      return false;
    }
  }

  // دالة تشفير كلمة المرور بمستوى حماية عالي
  async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 12; // مستوى تشفير عالي
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('فشل في تشفير كلمة المرور');
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
    const { date, amount, type, expenseType, description, projectId, fileUrl, fileType } = transaction;
    const createdBy = transaction.createdBy || 1; // استخدام القيمة الافتراضية 1 إذا لم يتم تحديد createdBy
    
    // إنشاء معاملة جديدة بالقيم المحددة
    const [newTransaction] = await db.insert(transactions).values({
      date,
      amount,
      type,
      expenseType,
      description,
      projectId,
      createdBy,
      fileUrl,
      fileType
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
    const { name, description, fileUrl, fileType, projectId, isManagerDocument } = document;
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
      uploadedBy,
      isManagerDocument: isManagerDocument || false // استخدام القيمة المحددة أو false كقيمة افتراضية
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
    try {
      console.log(`checkUserProjectAccess - التحقق من صلاحيات المستخدم ${userId} للوصول إلى المشروع ${projectId}`);
      
      // المدير لديه وصول لجميع المشاريع
      const user = await this.getUser(userId);
      if (user?.role === 'admin') {
        console.log(`checkUserProjectAccess - المستخدم هو مدير ولديه صلاحية الوصول لجميع المشاريع`);
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
      
      const hasAccess = result.length > 0;
      console.log(`checkUserProjectAccess - نتيجة التحقق من الصلاحيات للمستخدم ${userId}:`, hasAccess ? "مصرح" : "غير مصرح");
      return hasAccess;
    } catch (error) {
      console.error(`checkUserProjectAccess - خطأ أثناء التحقق من صلاحيات المستخدم:`, error);
      // في حالة حدوث خطأ، نفترض أن المستخدم ليس لديه صلاحيات
      return false;
    }
  }

  // ======== إدارة الصناديق ========
  
  async getFund(id: number): Promise<Fund | undefined> {
    const result = await db.select().from(funds).where(eq(funds.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  /**
   * البحث عن صندوق بناءً على المالك
   * @param ownerId معرف المالك
   * @param useMainAdmin عندما تكون true، ستستخدم دائماً صندوق المدير الرئيسي (معرف=1) بغض النظر عن المعرف المدخل
   * @returns صندوق المالك إذا وجد
   */
  async getFundByOwner(ownerId: number, useMainAdmin: boolean = false): Promise<Fund | undefined> {
    // إذا كانت قيمة useMainAdmin هي true، استخدم دائماً صندوق المدير الرئيسي (معرف=1)
    const effectiveOwnerId = useMainAdmin ? 1 : ownerId;
    
    console.log(`getFundByOwner - البحث عن صندوق للمالك: ${effectiveOwnerId}, useMainAdmin: ${useMainAdmin}`);
    
    const result = await db.select().from(funds)
      .where(
        and(
          eq(funds.type, 'admin'),
          eq(funds.ownerId, effectiveOwnerId)
        )
      );
      
    console.log(`getFundByOwner - نتيجة البحث:`, result.length > 0 ? "تم العثور على صندوق" : "لم يتم العثور على صندوق");
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
  async processDeposit(userId: number, projectId: number, amount: number, description: string): Promise<{ transaction: Transaction, adminTransaction?: Transaction, adminFund?: Fund, projectFund?: Fund }> {
    console.log(`processDeposit - بدء عملية إيداع بواسطة المستخدم ${userId} في المشروع ${projectId} بمبلغ ${amount}`);
    
    try {
      // التحقق من صلاحية المشروع
      const project = await this.getProject(projectId);
      if (!project) {
        console.log(`processDeposit - المشروع رقم ${projectId} غير موجود`);
        throw new Error("المشروع غير موجود");
      }
      console.log(`processDeposit - تم العثور على المشروع: ${project.name}`);

      // التحقق من صلاحية المستخدم
      const user = await this.getUser(userId);
      if (!user) {
        console.log(`processDeposit - المستخدم رقم ${userId} غير موجود`);
        throw new Error("المستخدم غير موجود");
      }
      console.log(`processDeposit - تم العثور على المستخدم: ${user.username}, الدور: ${user.role}`);

      // منح الوصول مباشرة للمديرين
      if (user.role === 'admin') {
        console.log(`processDeposit - المستخدم مدير ولديه صلاحية الوصول لجميع المشاريع`);
      } else {
        // التحقق من صلاحية المستخدم للوصول للمشروع
        const hasAccess = await this.checkUserProjectAccess(userId, projectId);
        if (!hasAccess) {
          console.log(`processDeposit - المستخدم ${userId} ليس لديه صلاحية الوصول للمشروع ${projectId}`);
          throw new Error("غير مصرح للمستخدم بالوصول لهذا المشروع");
        }
        console.log(`processDeposit - تم التحقق من صلاحية المستخدم للوصول للمشروع`);
      }

      // البحث عن صندوق المدير الرئيسي (دائماً مستخدم رقم 1)
      console.log(`processDeposit - جاري البحث عن صندوق المدير الرئيسي (المستخدم رقم 1)`);
      
      // البحث عن صندوق المدير الرئيسي بشكل مباشر
      const adminFundsResult = await db.select().from(funds)
        .where(
          and(
            eq(funds.type, 'admin'),
            eq(funds.ownerId, 1) // دائماً نستخدم المستخدم رقم 1 (المدير الرئيسي)
          )
        );
        
      let adminFund = adminFundsResult.length > 0 ? adminFundsResult[0] : undefined;
      console.log(`processDeposit - نتيجة البحث عن صندوق المدير الرئيسي:`, adminFund ? JSON.stringify(adminFund) : "غير موجود");
      
      if (!adminFund) {
        console.log(`processDeposit - صندوق المدير الرئيسي غير موجود، جاري إنشاء صندوق جديد`);
        // إنشاء صندوق المدير إذا لم يكن موجوداً
        adminFund = await this.createFund({
          name: "صندوق المدير الرئيسي",
          balance: 1000000, // رصيد افتراضي مليون وحدة
          type: "admin",
          ownerId: 1, // دائماً المستخدم رقم 1
          projectId: null
        });
        console.log(`processDeposit - تم إنشاء صندوق المدير الرئيسي:`, JSON.stringify(adminFund));
      }
      
      console.log(`processDeposit - رصيد المدير قبل العملية: ${adminFund.balance}`);

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
      
      console.log(`processDeposit - رصيد المشروع قبل العملية: ${projectFund.balance}`);

      // تنفيذ العملية في قاعدة البيانات كمعاملة واحدة
      try {
        // 1. خصم المبلغ من صندوق المدير - نقوم بتمرير قيمة سالبة للخصم
        const originalAdminBalance = adminFund.balance;
        
        // تحديث مباشر لصندوق المدير
        const [updatedAdminFund] = await db.update(funds)
          .set({ 
            balance: originalAdminBalance - amount, // نخصم المبلغ مباشرة
            updatedAt: new Date()
          })
          .where(eq(funds.id, adminFund.id))
          .returning();
          
        adminFund = updatedAdminFund;
            
        console.log(`processDeposit - المبلغ المخصوم من المدير: ${amount}, الرصيد قبل: ${originalAdminBalance}, الرصيد بعد: ${adminFund ? adminFund.balance : 'غير معروف'}`);
    
        // 2. إضافة المبلغ إلى صندوق المشروع
        const originalProjectBalance = projectFund.balance;
        
        // تحديث مباشر لصندوق المشروع
        const [updatedProjectFund] = await db.update(funds)
          .set({ 
            balance: originalProjectBalance + amount, // نضيف المبلغ مباشرة
            updatedAt: new Date()
          })
          .where(eq(funds.id, projectFund.id))
          .returning();
          
        projectFund = updatedProjectFund;
            
        console.log(`processDeposit - المبلغ المضاف للمشروع: ${amount}, الرصيد قبل: ${originalProjectBalance}, الرصيد بعد: ${projectFund ? projectFund.balance : 'غير معروف'}`);
      } catch (error) {
        console.error(`خطأ أثناء تحديث الأرصدة:`, error);
        if (error instanceof Error) {
          throw new Error(`فشل في تحديث الأرصدة: ${error.message}`);
        } else {
          throw new Error(`فشل في تحديث الأرصدة: خطأ غير معروف`);
        }
      }

      // 3. إنشاء معاملة إيداع في المشروع
      const projectTransaction = await this.createTransaction({
        date: new Date(),
        amount,
        type: "income",
        description: description || `إيداع مبلغ في المشروع: ${project.name}`,
        projectId,
        createdBy: userId,
        fileUrl: null,
        fileType: null
      });

      // 4. إنشاء معاملة مصروف للمدير (لتسجيل خروج المبلغ من صندوق المدير)
      const adminTransaction = await this.createTransaction({
        date: new Date(),
        amount,
        type: "expense",
        expenseType: "مصروف عام",
        description: `مصروف تمويل المشروع: ${project.name}`,
        projectId: null, // لا يرتبط بمشروع محدد لأنه معاملة للمدير
        createdBy: userId,
        fileUrl: null,
        fileType: null
      });

      // 5. إنشاء سجل نشاط
      await this.createActivityLog({
        action: "create",
        entityType: "transaction",
        entityId: projectTransaction.id,
        details: `إيداع مبلغ ${amount} في المشروع: ${project.name}`,
        userId
      });
      
      console.log(`processDeposit - اكتمال العملية، تفاصيل النتيجة: معاملة المشروع رقم ${projectTransaction.id}, معاملة المدير رقم ${adminTransaction.id}, رصيد المدير الجديد: ${adminFund ? adminFund.balance : 'غير معروف'}, رصيد المشروع الجديد: ${projectFund ? projectFund.balance : 'غير معروف'}`);

      return {
        transaction: projectTransaction, // نرجع معاملة المشروع للتوافقية مع الكود القديم
        adminTransaction: adminTransaction, // معاملة المصاريف للمدير
        adminFund,
        projectFund
      };
    } catch (error) {
      console.error(`processDeposit - خطأ أثناء معالجة العملية:`, error);
      throw error; // إعادة إلقاء الخطأ للتعامل معه في الطبقة العليا
    }
  }

  // عملية السحب: يستقطع المبلغ من صندوق المشروع نفسه
  async processWithdrawal(userId: number, projectId: number, amount: number, description: string, expenseType?: string): Promise<{ transaction: Transaction, projectFund?: Fund }> {
    console.log(`processWithdrawal - بدء عملية صرف بواسطة المستخدم ${userId} من المشروع ${projectId} بمبلغ ${amount}`);
    
    try {
      // التحقق من صلاحية المشروع
      const project = await this.getProject(projectId);
      if (!project) {
        console.log(`processWithdrawal - المشروع رقم ${projectId} غير موجود`);
        throw new Error("المشروع غير موجود");
      }
      console.log(`processWithdrawal - تم العثور على المشروع: ${project.name}`);

      // التحقق من صلاحية المستخدم
      const user = await this.getUser(userId);
      if (!user) {
        console.log(`processWithdrawal - المستخدم رقم ${userId} غير موجود`);
        throw new Error("المستخدم غير موجود");
      }
      console.log(`processWithdrawal - تم العثور على المستخدم: ${user.username}, الدور: ${user.role}`);

      // منح الوصول مباشرة للمديرين
      if (user.role === 'admin') {
        console.log(`processWithdrawal - المستخدم مدير ولديه صلاحية الوصول لجميع المشاريع`);
      } else {
        // التحقق من صلاحية المستخدم للوصول للمشروع
        const hasAccess = await this.checkUserProjectAccess(userId, projectId);
        if (!hasAccess) {
          console.log(`processWithdrawal - المستخدم ${userId} ليس لديه صلاحية الوصول للمشروع ${projectId}`);
          throw new Error("غير مصرح للمستخدم بالوصول لهذا المشروع");
        }
        console.log(`processWithdrawal - تم التحقق من صلاحية المستخدم للوصول للمشروع`);
      }

      // البحث عن صندوق المشروع
      let projectFund = await this.getFundByProject(projectId);
      
      // إذا لم يكن الصندوق موجوداً، قم بإنشائه
      if (!projectFund) {
        console.log(`processWithdrawal - صندوق المشروع غير موجود للمشروع رقم ${projectId}، سيتم إنشاؤه`);
        
        projectFund = await this.createFund({
          name: `صندوق المشروع: ${project.name}`,
          balance: 0,
          type: "project",
          ownerId: null,
          projectId
        });
        
        console.log(`processWithdrawal - تم إنشاء صندوق جديد للمشروع بمعرف: ${projectFund.id}`);
      }
      
      console.log(`processWithdrawal - رصيد المشروع قبل العملية: ${projectFund.balance}`);

      // التحقق من رصيد المشروع
      // إذا كان المستخدم مديرًا، نسمح بالسحب حتى لو كان الرصيد 0 (سيتم تسجيله كسحب على المكشوف)
      if (user && user.role !== 'admin' && projectFund.balance < amount) {
        console.log(`processWithdrawal - رصيد المشروع غير كافي. الرصيد الحالي: ${projectFund.balance}, المبلغ المطلوب: ${amount}`);
        throw new Error("رصيد المشروع غير كافي لإجراء العملية");
      }

      // خصم المبلغ من صندوق المشروع
      try {
        const originalBalance = projectFund.balance;
        
        // تحديث مباشر لصندوق المشروع
        const [updatedProjectFund] = await db.update(funds)
          .set({ 
            balance: originalBalance - amount, // نخصم المبلغ مباشرة
            updatedAt: new Date()
          })
          .where(eq(funds.id, projectFund.id))
          .returning();
        
        console.log(`processWithdrawal - خصم مبلغ ${amount} من المشروع. الرصيد قبل: ${originalBalance}، الرصيد بعد: ${updatedProjectFund ? updatedProjectFund.balance : 'غير معروف'}`);
        
        // إنشاء معاملة جديدة
        const transaction = await this.createTransaction({
          date: new Date(),
          amount,
          type: "expense",
          expenseType: expenseType || "مصروف عام",
          description: description || `صرف مبلغ من المشروع: ${project.name}`,
          projectId,
          createdBy: userId,
          fileUrl: null,
          fileType: null
        });
    
        // إنشاء سجل نشاط
        await this.createActivityLog({
          action: "create",
          entityType: "transaction",
          entityId: transaction.id,
          details: `صرف مبلغ ${amount} من المشروع: ${project.name}`,
          userId
        });
        
        console.log(`processWithdrawal - اكتمال العملية، معاملة رقم ${transaction.id}، الرصيد النهائي للمشروع: ${updatedProjectFund ? updatedProjectFund.balance : 'غير معروف'}`);
        
        return {
          transaction,
          projectFund: updatedProjectFund
        };
      } catch (error) {
        console.error(`خطأ أثناء تحديث رصيد المشروع:`, error);
        if (error instanceof Error) {
          throw new Error(`فشل في تحديث رصيد المشروع: ${error.message}`);
        } else {
          throw new Error(`فشل في تحديث رصيد المشروع: خطأ غير معروف`);
        }
      }
    } catch (error) {
      console.error(`processWithdrawal - خطأ أثناء معالجة عملية السحب:`, error);
      throw error; // إعادة إلقاء الخطأ للتعامل معه في الطبقة العليا
    }
  }

  // عملية المدير: إيراد يضاف للصندوق، صرف يخصم من الصندوق
  async processAdminTransaction(userId: number, type: string, amount: number, description: string): Promise<{ transaction: Transaction, adminFund?: Fund }> {
    console.log(`processAdminTransaction - بدء عملية ${type} للمدير ${userId} بمبلغ ${amount}`);
    
    try {
      // التحقق من أن المستخدم مدير
      const user = await this.getUser(userId);
      if (!user) {
        console.log(`processAdminTransaction - المستخدم رقم ${userId} غير موجود`);
        throw new Error("المستخدم غير موجود");
      }
      console.log(`processAdminTransaction - تم العثور على المستخدم: ${user.username}, الدور: ${user.role}`);
      
      if (user.role !== "admin") {
        console.log(`processAdminTransaction - المستخدم ليس مديرًا، الدور الحالي: ${user.role}`);
        throw new Error("هذه العملية متاحة للمدير فقط");
      }

      // البحث عن صندوق المدير الرئيسي (دائماً مستخدم رقم 1)
      console.log(`processAdminTransaction - جاري البحث عن صندوق المدير الرئيسي`);
      
      // البحث عن صندوق المدير الرئيسي بشكل مباشر
      const adminFundsResult = await db.select().from(funds)
        .where(
          and(
            eq(funds.type, 'admin'),
            eq(funds.ownerId, 1) // دائماً نستخدم المستخدم رقم 1 (المدير الرئيسي)
          )
        );
        
      let adminFund = adminFundsResult.length > 0 ? adminFundsResult[0] : undefined;
      console.log(`processAdminTransaction - نتيجة البحث عن صندوق المدير الرئيسي:`, adminFund ? JSON.stringify(adminFund) : "غير موجود");
      
      if (!adminFund) {
        // إنشاء صندوق افتراضي للمدير إذا لم يكن موجودا
        console.log(`processAdminTransaction - إنشاء صندوق مدير رئيسي جديد`);
        adminFund = await this.createFund({
          name: "صندوق المدير الرئيسي",
          balance: type === "income" ? amount : 0, // إذا كانت العملية إيداع، ابدأ برصيد العملية
          type: "admin",
          ownerId: 1, // دائماً المستخدم رقم 1
          projectId: null
        });
        console.log(`processAdminTransaction - تم إنشاء صندوق مدير رئيسي برصيد ${adminFund.balance}`);
      } else {
        console.log(`processAdminTransaction - رصيد المدير قبل العملية: ${adminFund.balance}`);
        
        // التحقق من الرصيد في حالة الصرف
        if (type === "expense" && adminFund.balance < amount) {
          console.log(`processAdminTransaction - رصيد المدير غير كافي. الرصيد الحالي: ${adminFund.balance}, المبلغ المطلوب: ${amount}`);
          throw new Error("رصيد الصندوق غير كافي لإجراء العملية");
        }

        try {
          // تحديث رصيد صندوق المدير مباشرة
          const originalBalance = adminFund.balance;
          const newBalance = type === "income" ? originalBalance + amount : originalBalance - amount;
          
          // تحديث مباشر لصندوق المدير
          const [updatedAdminFund] = await db.update(funds)
            .set({ 
              balance: newBalance,
              updatedAt: new Date()
            })
            .where(eq(funds.id, adminFund.id))
            .returning();
            
          adminFund = updatedAdminFund;
          
          console.log(`processAdminTransaction - ${type === "income" ? "إضافة" : "خصم"} مبلغ ${amount} ${type === "income" ? "إلى" : "من"} صندوق المدير. الرصيد قبل: ${originalBalance}، الرصيد بعد: ${adminFund ? adminFund.balance : 'غير معروف'}`);
        } catch (error) {
          console.error(`خطأ أثناء تحديث رصيد المدير:`, error);
          if (error instanceof Error) {
            throw new Error(`فشل في تحديث رصيد المدير: ${error.message}`);
          } else {
            throw new Error(`فشل في تحديث رصيد المدير: خطأ غير معروف`);
          }
        }
      }

      // إنشاء معاملة جديدة
      const transaction = await this.createTransaction({
        date: new Date(),
        amount,
        type,
        expenseType: type === "expense" ? "مصروف عام" : undefined,
        description: description || `${type === "income" ? "إيراد" : "مصروف"} للمدير`,
        projectId: null, // لا يرتبط بمشروع
        createdBy: userId,
        fileUrl: null,
        fileType: null
      });

      // إنشاء سجل نشاط
      await this.createActivityLog({
        action: "create",
        entityType: "transaction",
        entityId: transaction.id,
        details: `${type === "income" ? "إيراد" : "مصروف"} للمدير: ${amount}`,
        userId
      });
      
      console.log(`processAdminTransaction - اكتمال العملية، معاملة رقم ${transaction.id}، الرصيد النهائي للمدير: ${adminFund ? adminFund.balance : 'غير معروف'}`);

      return {
        transaction,
        adminFund
      };
    } catch (error) {
      console.error(`processAdminTransaction - خطأ أثناء معالجة عملية ${type} للمدير:`, error);
      throw error; // إعادة إلقاء الخطأ للتعامل معه في الطبقة العليا
    }
  }
}

// تصدير كائن التخزين للاستخدام في جميع أنحاء التطبيق
export const pgStorage = new PgStorage();