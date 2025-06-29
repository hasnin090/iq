import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../shared/schema';
import type { IStorage } from './storage';
import type {
  User, InsertUser, Project, InsertProject, Transaction, InsertTransaction,
  Document, InsertDocument, ActivityLog, InsertActivityLog, Setting, InsertSetting,
  UserProject, InsertUserProject, Fund, InsertFund, ExpenseType, InsertExpenseType,
  LedgerEntry, InsertLedgerEntry, AccountCategory, InsertAccountCategory,
  DeferredPayment, InsertDeferredPayment, Employee, InsertEmployee
} from '../shared/schema';
import { eq, desc, and, or, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export class PgStorage implements IStorage {
  async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        );
      `;
      return result[0]?.exists || false;
    } catch (error) {
      console.error(`Error checking table ${tableName}:`, error);
      return false;
    }
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const result = await db.update(schema.users)
      .set(user)
      .where(eq(schema.users.id, id))
      .returning();
    return result[0];
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(schema.users).where(eq(schema.users.id, id));
    return result.rowCount > 0;
  }

  async validatePassword(storedPassword: string, inputPassword: string): Promise<boolean> {
    return await bcrypt.compare(inputPassword, storedPassword);
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
    return result[0];
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(schema.projects).values(project).returning();
    return result[0];
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project | undefined> {
    const result = await db.update(schema.projects)
      .set(project)
      .where(eq(schema.projects.id, id))
      .returning();
    return result[0];
  }

  async listProjects(): Promise<Project[]> {
    return await db.select().from(schema.projects);
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(schema.projects).where(eq(schema.projects.id, id));
    return result.rowCount > 0;
  }

  // User Projects
  async assignUserToProject(userProject: InsertUserProject): Promise<UserProject> {
    const result = await db.insert(schema.userProjects).values(userProject).returning();
    return result[0];
  }

  async removeUserFromProject(userId: number, projectId: number): Promise<boolean> {
    const result = await db.delete(schema.userProjects)
      .where(and(
        eq(schema.userProjects.userId, userId),
        eq(schema.userProjects.projectId, projectId)
      ));
    return result.rowCount > 0;
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    const result = await db.select({
      id: schema.projects.id,
      name: schema.projects.name,
      description: schema.projects.description,
      startDate: schema.projects.startDate,
      status: schema.projects.status,
      progress: schema.projects.progress,
      createdBy: schema.projects.createdBy
    })
    .from(schema.projects)
    .innerJoin(schema.userProjects, eq(schema.projects.id, schema.userProjects.projectId))
    .where(eq(schema.userProjects.userId, userId));
    return result;
  }

  async getProjectUsers(projectId: number): Promise<User[]> {
    const result = await db.select({
      id: schema.users.id,
      username: schema.users.username,
      password: schema.users.password,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      permissions: schema.users.permissions,
      active: schema.users.active
    })
    .from(schema.users)
    .innerJoin(schema.userProjects, eq(schema.users.id, schema.userProjects.userId))
    .where(eq(schema.userProjects.projectId, projectId));
    return result;
  }

  async checkUserProjectAccess(userId: number, projectId: number): Promise<boolean> {
    const result = await db.select()
      .from(schema.userProjects)
      .where(and(
        eq(schema.userProjects.userId, userId),
        eq(schema.userProjects.projectId, projectId)
      ));
    return result.length > 0;
  }

  // Transactions
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const result = await db.select().from(schema.transactions).where(eq(schema.transactions.id, id));
    return result[0];
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(schema.transactions).values(transaction).returning();
    return result[0];
  }

  async updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction | undefined> {
    const result = await db.update(schema.transactions)
      .set(transaction)
      .where(eq(schema.transactions.id, id))
      .returning();
    return result[0];
  }

  async listTransactions(): Promise<Transaction[]> {
    return await db.select().from(schema.transactions).orderBy(desc(schema.transactions.date));
  }

  async getTransactionsByProject(projectId: number): Promise<Transaction[]> {
    return await db.select()
      .from(schema.transactions)
      .where(eq(schema.transactions.projectId, projectId))
      .orderBy(desc(schema.transactions.date));
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db.delete(schema.transactions).where(eq(schema.transactions.id, id));
    return result.rowCount > 0;
  }

  // Funds
  async getFund(id: number): Promise<Fund | undefined> {
    const result = await db.select().from(schema.funds).where(eq(schema.funds.id, id));
    return result[0];
  }

  async getFundByOwner(ownerId: number): Promise<Fund | undefined> {
    const result = await db.select().from(schema.funds)
      .where(and(
        eq(schema.funds.ownerId, ownerId),
        eq(schema.funds.type, 'admin')
      ));
    return result[0];
  }

  async getFundByProject(projectId: number): Promise<Fund | undefined> {
    const result = await db.select().from(schema.funds)
      .where(eq(schema.funds.projectId, projectId));
    return result[0];
  }

  async createFund(fund: InsertFund): Promise<Fund> {
    const result = await db.insert(schema.funds).values(fund).returning();
    return result[0];
  }

  async updateFundBalance(id: number, amount: number): Promise<Fund | undefined> {
    const result = await db.update(schema.funds)
      .set({ balance: amount })
      .where(eq(schema.funds.id, id))
      .returning();
    return result[0];
  }

  async listFunds(): Promise<Fund[]> {
    return await db.select().from(schema.funds);
  }

  async processDeposit(userId: number, projectId: number, amount: number, description: string): Promise<{ transaction: Transaction, adminFund?: Fund, projectFund?: Fund }> {
    throw new Error('Method not implemented in PgStorage');
  }

  async processWithdrawal(userId: number, projectId: number, amount: number, description: string, expenseType?: string): Promise<{ transaction: Transaction, adminFund?: Fund, projectFund?: Fund }> {
    throw new Error('Method not implemented in PgStorage');
  }

  async processAdminTransaction(userId: number, type: string, amount: number, description: string): Promise<{ transaction: Transaction, adminFund?: Fund }> {
    throw new Error('Method not implemented in PgStorage');
  }

  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    const result = await db.select().from(schema.documents).where(eq(schema.documents.id, id));
    return result[0];
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const result = await db.insert(schema.documents).values(document).returning();
    return result[0];
  }

  async updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined> {
    const result = await db.update(schema.documents)
      .set(document)
      .where(eq(schema.documents.id, id))
      .returning();
    return result[0];
  }

  async listDocuments(): Promise<Document[]> {
    return await db.select().from(schema.documents);
  }

  async getDocumentsByProject(projectId: number): Promise<Document[]> {
    return await db.select().from(schema.documents)
      .where(eq(schema.documents.projectId, projectId));
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(schema.documents).where(eq(schema.documents.id, id));
    return result.rowCount > 0;
  }

  // Activity Logs
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(schema.activityLogs).values(log).returning();
    return result[0];
  }

  async listActivityLogs(): Promise<ActivityLog[]> {
    return await db.select().from(schema.activityLogs).orderBy(desc(schema.activityLogs.timestamp));
  }

  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return await db.select().from(schema.activityLogs)
      .where(eq(schema.activityLogs.userId, userId))
      .orderBy(desc(schema.activityLogs.timestamp));
  }

  async getActivityLogsByEntity(entityType: string, entityId: number): Promise<ActivityLog[]> {
    return await db.select().from(schema.activityLogs)
      .where(and(
        eq(schema.activityLogs.entityType, entityType),
        eq(schema.activityLogs.entityId, entityId)
      ))
      .orderBy(desc(schema.activityLogs.timestamp));
  }

  // Settings
  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
    return result[0];
  }

  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    const result = await db.update(schema.settings)
      .set({ value })
      .where(eq(schema.settings.key, key))
      .returning();
    return result[0];
  }

  async listSettings(): Promise<Setting[]> {
    return await db.select().from(schema.settings);
  }

  // Expense Types
  async getExpenseType(id: number): Promise<ExpenseType | undefined> {
    const result = await db.select().from(schema.expenseTypes).where(eq(schema.expenseTypes.id, id));
    return result[0];
  }

  async getExpenseTypeByName(name: string): Promise<ExpenseType | undefined> {
    const result = await db.select().from(schema.expenseTypes).where(eq(schema.expenseTypes.name, name));
    return result[0];
  }

  async createExpenseType(expenseType: InsertExpenseType): Promise<ExpenseType> {
    const result = await db.insert(schema.expenseTypes).values(expenseType).returning();
    return result[0];
  }

  async updateExpenseType(id: number, expenseType: Partial<ExpenseType>): Promise<ExpenseType | undefined> {
    const result = await db.update(schema.expenseTypes)
      .set(expenseType)
      .where(eq(schema.expenseTypes.id, id))
      .returning();
    return result[0];
  }

  async listExpenseTypes(): Promise<ExpenseType[]> {
    return await db.select().from(schema.expenseTypes);
  }

  async deleteExpenseType(id: number): Promise<boolean> {
    const result = await db.delete(schema.expenseTypes).where(eq(schema.expenseTypes.id, id));
    return result.rowCount > 0;
  }

  // Ledger Entries
  async createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry> {
    const result = await db.insert(schema.ledgerEntries).values(entry).returning();
    return result[0];
  }

  async updateLedgerEntry(id: number, entry: Partial<LedgerEntry>): Promise<LedgerEntry | undefined> {
    const result = await db.update(schema.ledgerEntries)
      .set(entry)
      .where(eq(schema.ledgerEntries.id, id))
      .returning();
    return result[0];
  }

  async getLedgerEntriesByType(entryType: string): Promise<LedgerEntry[]> {
    return await db.select().from(schema.ledgerEntries)
      .where(eq(schema.ledgerEntries.entryType, entryType))
      .orderBy(desc(schema.ledgerEntries.createdAt));
  }

  async getLedgerEntriesByProject(projectId: number): Promise<LedgerEntry[]> {
    return await db.select().from(schema.ledgerEntries)
      .where(eq(schema.ledgerEntries.projectId, projectId))
      .orderBy(desc(schema.ledgerEntries.createdAt));
  }

  async getLedgerEntriesByExpenseType(expenseTypeId: number): Promise<LedgerEntry[]> {
    return await db.select().from(schema.ledgerEntries)
      .where(eq(schema.ledgerEntries.expenseTypeId, expenseTypeId))
      .orderBy(desc(schema.ledgerEntries.createdAt));
  }

  async listLedgerEntries(): Promise<LedgerEntry[]> {
    return await db.select().from(schema.ledgerEntries)
      .orderBy(desc(schema.ledgerEntries.createdAt));
  }

  // Classification
  async classifyExpenseTransaction(transaction: Transaction, forceClassify?: boolean): Promise<void> {
    // Implementation for expense classification
    console.log(`Classifying transaction ${transaction.id}`);
  }

  // Account Categories
  async getAccountCategory(id: number): Promise<AccountCategory | undefined> {
    const result = await db.select().from(schema.accountCategories)
      .where(eq(schema.accountCategories.id, id));
    return result[0];
  }

  async createAccountCategory(category: InsertAccountCategory): Promise<AccountCategory> {
    const result = await db.insert(schema.accountCategories).values(category).returning();
    return result[0];
  }

  async updateAccountCategory(id: number, category: Partial<AccountCategory>): Promise<AccountCategory | undefined> {
    const result = await db.update(schema.accountCategories)
      .set(category)
      .where(eq(schema.accountCategories.id, id))
      .returning();
    return result[0];
  }

  async listAccountCategories(): Promise<AccountCategory[]> {
    return await db.select().from(schema.accountCategories);
  }

  async deleteAccountCategory(id: number): Promise<boolean> {
    const result = await db.delete(schema.accountCategories)
      .where(eq(schema.accountCategories.id, id));
    return result.rowCount > 0;
  }

  // Deferred Payments
  async getDeferredPayment(id: number): Promise<DeferredPayment | undefined> {
    const result = await db.select().from(schema.deferredPayments)
      .where(eq(schema.deferredPayments.id, id));
    return result[0];
  }

  async createDeferredPayment(payment: InsertDeferredPayment): Promise<DeferredPayment> {
    const result = await db.insert(schema.deferredPayments).values(payment).returning();
    return result[0];
  }

  async updateDeferredPayment(id: number, payment: Partial<DeferredPayment>): Promise<DeferredPayment | undefined> {
    const result = await db.update(schema.deferredPayments)
      .set(payment)
      .where(eq(schema.deferredPayments.id, id))
      .returning();
    return result[0];
  }

  async listDeferredPayments(): Promise<DeferredPayment[]> {
    return await db.select().from(schema.deferredPayments)
      .orderBy(desc(schema.deferredPayments.createdAt));
  }

  async deleteDeferredPayment(id: number): Promise<boolean> {
    const result = await db.delete(schema.deferredPayments)
      .where(eq(schema.deferredPayments.id, id));
    return result.rowCount > 0;
  }

  async payDeferredPaymentInstallment(id: number, amount: number, userId: number): Promise<{ payment: DeferredPayment; transaction?: Transaction }> {
    // Implementation for payment installment
    const payment = await this.getDeferredPayment(id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const newPaidAmount = (payment.paidAmount || 0) + amount;
    const updatedPayment = await this.updateDeferredPayment(id, {
      paidAmount: newPaidAmount,
      status: newPaidAmount >= payment.totalAmount ? 'completed' : 'partial'
    });

    return { payment: updatedPayment! };
  }

  // Employees
  async getEmployee(id: number): Promise<Employee | undefined> {
    const result = await db.select().from(schema.employees)
      .where(eq(schema.employees.id, id));
    return result[0];
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const result = await db.insert(schema.employees).values(employee).returning();
    return result[0];
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee> {
    const result = await db.update(schema.employees)
      .set(employee)
      .where(eq(schema.employees.id, id))
      .returning();
    return result[0];
  }

  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(schema.employees);
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db.delete(schema.employees)
      .where(eq(schema.employees.id, id));
    return result.rowCount > 0;
  }

  async getEmployeesByProject(projectId: number): Promise<Employee[]> {
    return await db.select().from(schema.employees)
      .where(eq(schema.employees.assignedProjectId, projectId));
  }

  async getActiveEmployees(): Promise<Employee[]> {
    return await db.select().from(schema.employees)
      .where(eq(schema.employees.active, true));
  }
}

export const pgStorage = new PgStorage();