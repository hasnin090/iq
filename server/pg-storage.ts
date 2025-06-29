import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import {
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  transactions, type Transaction, type InsertTransaction,
  documents, type Document, type InsertDocument,
  activityLogs, type ActivityLog, type InsertActivityLog,
  settings, type Setting, type InsertSetting,
  userProjects, type UserProject, type InsertUserProject,
  funds, type Fund, type InsertFund,
  expenseTypes, type ExpenseType, type InsertExpenseType,
  ledgerEntries, type LedgerEntry, type InsertLedgerEntry,
  accountCategories, type AccountCategory, type InsertAccountCategory,
  deferredPayments, type DeferredPayment, type InsertDeferredPayment,
  employees, type Employee, type InsertEmployee
} from '@shared/schema';
import { IStorage } from './storage';

export class PgStorage implements IStorage {
  private sql = neon(process.env.DATABASE_URL!);

  constructor() {
    console.log('PgStorage: Connected to PostgreSQL database');
  }

  async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        );
      `;
      return result[0]?.exists || false;
    } catch (error) {
      console.error('Error checking table existence:', error);
      return false;
    }
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await this.sql`SELECT * FROM users WHERE id = ${id}`;
      return result[0] as User | undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.sql`SELECT * FROM users WHERE username = ${username}`;
      return result[0] as User | undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await this.sql`SELECT * FROM users WHERE email = ${email}`;
      return result[0] as User | undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await this.sql`
        INSERT INTO users (username, password, name, email, role, permissions, active)
        VALUES (${user.username}, ${user.password}, ${user.name}, ${user.email || null}, ${user.role || 'user'}, ${JSON.stringify(user.permissions || [])}, ${true})
        RETURNING *
      `;
      return result[0] as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    try {
      const setParts = [];
      const values = [];
      
      if (user.username !== undefined) {
        setParts.push(`username = $${setParts.length + 1}`);
        values.push(user.username);
      }
      if (user.password !== undefined) {
        setParts.push(`password = $${setParts.length + 1}`);
        values.push(user.password);
      }
      if (user.name !== undefined) {
        setParts.push(`name = $${setParts.length + 1}`);
        values.push(user.name);
      }
      if (user.email !== undefined) {
        setParts.push(`email = $${setParts.length + 1}`);
        values.push(user.email);
      }
      if (user.role !== undefined) {
        setParts.push(`role = $${setParts.length + 1}`);
        values.push(user.role);
      }
      if (user.permissions !== undefined) {
        setParts.push(`permissions = $${setParts.length + 1}`);
        values.push(JSON.stringify(user.permissions));
      }
      if (user.active !== undefined) {
        setParts.push(`active = $${setParts.length + 1}`);
        values.push(user.active);
      }

      if (setParts.length === 0) return this.getUser(id);

      const query = `UPDATE users SET ${setParts.join(', ')} WHERE id = $${setParts.length + 1} RETURNING *`;
      values.push(id);
      
      const result = await this.sql(query, values);
      return result[0] as User | undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async listUsers(): Promise<User[]> {
    try {
      const result = await this.sql`SELECT * FROM users ORDER BY id`;
      return result as User[];
    } catch (error) {
      console.error('Error listing users:', error);
      return [];
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await this.sql`DELETE FROM users WHERE id = ${id}`;
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async validatePassword(storedPassword: string, inputPassword: string): Promise<boolean> {
    return bcrypt.compare(inputPassword, storedPassword);
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    try {
      const result = await this.sql`SELECT * FROM projects WHERE id = ${id}`;
      return result[0] as Project | undefined;
    } catch (error) {
      console.error('Error getting project:', error);
      return undefined;
    }
  }

  async createProject(project: InsertProject): Promise<Project> {
    try {
      const result = await this.sql`
        INSERT INTO projects (name, description, budget, spent, created_by)
        VALUES (${project.name}, ${project.description || null}, ${project.budget || 0}, ${project.spent || 0}, ${project.createdBy})
        RETURNING *
      `;
      return result[0] as Project;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project | undefined> {
    try {
      const setParts = [];
      const values = [];
      
      if (project.name !== undefined) {
        setParts.push(`name = $${setParts.length + 1}`);
        values.push(project.name);
      }
      if (project.description !== undefined) {
        setParts.push(`description = $${setParts.length + 1}`);
        values.push(project.description);
      }
      if (project.budget !== undefined) {
        setParts.push(`budget = $${setParts.length + 1}`);
        values.push(project.budget);
      }
      if (project.spent !== undefined) {
        setParts.push(`spent = $${setParts.length + 1}`);
        values.push(project.spent);
      }

      if (setParts.length === 0) return this.getProject(id);

      const query = `UPDATE projects SET ${setParts.join(', ')} WHERE id = $${setParts.length + 1} RETURNING *`;
      values.push(id);
      
      const result = await this.sql(query, values);
      return result[0] as Project | undefined;
    } catch (error) {
      console.error('Error updating project:', error);
      return undefined;
    }
  }

  async listProjects(): Promise<Project[]> {
    try {
      const result = await this.sql`SELECT * FROM projects ORDER BY id DESC`;
      return result as Project[];
    } catch (error) {
      console.error('Error listing projects:', error);
      return [];
    }
  }

  async deleteProject(id: number): Promise<boolean> {
    try {
      const result = await this.sql`DELETE FROM projects WHERE id = ${id}`;
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // User Projects
  async assignUserToProject(userProject: InsertUserProject): Promise<UserProject> {
    try {
      const result = await this.sql`
        INSERT INTO user_projects (user_id, project_id, role)
        VALUES (${userProject.userId}, ${userProject.projectId}, ${userProject.role || 'member'})
        RETURNING *
      `;
      return result[0] as UserProject;
    } catch (error) {
      console.error('Error assigning user to project:', error);
      throw error;
    }
  }

  async removeUserFromProject(userId: number, projectId: number): Promise<boolean> {
    try {
      const result = await this.sql`
        DELETE FROM user_projects WHERE user_id = ${userId} AND project_id = ${projectId}
      `;
      return result.length > 0;
    } catch (error) {
      console.error('Error removing user from project:', error);
      return false;
    }
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    try {
      console.log(`PgStorage: Getting projects for user ${userId}`);
      const result = await this.sql`
        SELECT p.* FROM projects p
        JOIN user_projects up ON p.id = up.project_id
        WHERE up.user_id = ${userId}
        ORDER BY p.id DESC
      `;
      console.log(`PgStorage: Found ${result.length} projects for user ${userId}:`, result.map(p => ({ id: p.id, name: p.name })));
      return result as Project[];
    } catch (error) {
      console.error('Error getting user projects:', error);
      return [];
    }
  }

  async getProjectUsers(projectId: number): Promise<User[]> {
    try {
      const result = await this.sql`
        SELECT u.* FROM users u
        JOIN user_projects up ON u.id = up.user_id
        WHERE up.project_id = ${projectId}
        ORDER BY u.id
      `;
      return result as User[];
    } catch (error) {
      console.error('Error getting project users:', error);
      return [];
    }
  }

  async checkUserProjectAccess(userId: number, projectId: number): Promise<boolean> {
    try {
      const result = await this.sql`
        SELECT 1 FROM user_projects WHERE user_id = ${userId} AND project_id = ${projectId}
      `;
      return result.length > 0;
    } catch (error) {
      console.error('Error checking user project access:', error);
      return false;
    }
  }

  // Transactions
  async getTransaction(id: number): Promise<Transaction | undefined> {
    try {
      const result = await this.sql`SELECT * FROM transactions WHERE id = ${id}`;
      return result[0] as Transaction | undefined;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return undefined;
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      const result = await this.sql`
        INSERT INTO transactions (date, type, project_id, description, created_by, amount, expense_type, employee_id, file_url, file_type, archived)
        VALUES (${transaction.date}, ${transaction.type}, ${transaction.projectId || null}, ${transaction.description}, ${transaction.createdBy}, ${transaction.amount}, ${transaction.expenseType || null}, ${transaction.employeeId || null}, ${transaction.fileUrl || null}, ${transaction.fileType || null}, ${transaction.archived || false})
        RETURNING *
      `;
      return result[0] as Transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction | undefined> {
    try {
      const setParts = [];
      const values = [];
      
      if (transaction.date !== undefined) {
        setParts.push(`date = $${setParts.length + 1}`);
        values.push(transaction.date);
      }
      if (transaction.type !== undefined) {
        setParts.push(`type = $${setParts.length + 1}`);
        values.push(transaction.type);
      }
      if (transaction.projectId !== undefined) {
        setParts.push(`project_id = $${setParts.length + 1}`);
        values.push(transaction.projectId);
      }
      if (transaction.description !== undefined) {
        setParts.push(`description = $${setParts.length + 1}`);
        values.push(transaction.description);
      }
      if (transaction.amount !== undefined) {
        setParts.push(`amount = $${setParts.length + 1}`);
        values.push(transaction.amount);
      }
      if (transaction.expenseType !== undefined) {
        setParts.push(`expense_type = $${setParts.length + 1}`);
        values.push(transaction.expenseType);
      }
      if (transaction.employeeId !== undefined) {
        setParts.push(`employee_id = $${setParts.length + 1}`);
        values.push(transaction.employeeId);
      }
      if (transaction.fileUrl !== undefined) {
        setParts.push(`file_url = $${setParts.length + 1}`);
        values.push(transaction.fileUrl);
      }
      if (transaction.fileType !== undefined) {
        setParts.push(`file_type = $${setParts.length + 1}`);
        values.push(transaction.fileType);
      }
      if (transaction.archived !== undefined) {
        setParts.push(`archived = $${setParts.length + 1}`);
        values.push(transaction.archived);
      }

      if (setParts.length === 0) return this.getTransaction(id);

      const query = `UPDATE transactions SET ${setParts.join(', ')} WHERE id = $${setParts.length + 1} RETURNING *`;
      values.push(id);
      
      const result = await this.sql(query, values);
      return result[0] as Transaction | undefined;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return undefined;
    }
  }

  async listTransactions(): Promise<Transaction[]> {
    try {
      const result = await this.sql`SELECT * FROM transactions ORDER BY date DESC, id DESC`;
      return result as Transaction[];
    } catch (error) {
      console.error('Error listing transactions:', error);
      return [];
    }
  }

  async getTransactionsByProject(projectId: number): Promise<Transaction[]> {
    try {
      const result = await this.sql`
        SELECT * FROM transactions WHERE project_id = ${projectId} ORDER BY date DESC, id DESC
      `;
      return result as Transaction[];
    } catch (error) {
      console.error('Error getting transactions by project:', error);
      return [];
    }
  }

  async deleteTransaction(id: number): Promise<boolean> {
    try {
      const result = await this.sql`DELETE FROM transactions WHERE id = ${id}`;
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  }

  // Funds
  async getFund(id: number): Promise<Fund | undefined> {
    try {
      const result = await this.sql`SELECT * FROM funds WHERE id = ${id}`;
      return result[0] as Fund | undefined;
    } catch (error) {
      console.error('Error getting fund:', error);
      return undefined;
    }
  }

  async getFundByOwner(ownerId: number): Promise<Fund | undefined> {
    try {
      const result = await this.sql`SELECT * FROM funds WHERE owner_id = ${ownerId} AND type = 'admin'`;
      return result[0] as Fund | undefined;
    } catch (error) {
      console.error('Error getting fund by owner:', error);
      return undefined;
    }
  }

  async getFundByProject(projectId: number): Promise<Fund | undefined> {
    try {
      const result = await this.sql`SELECT * FROM funds WHERE project_id = ${projectId} AND type = 'project'`;
      return result[0] as Fund | undefined;
    } catch (error) {
      console.error('Error getting fund by project:', error);
      return undefined;
    }
  }

  async createFund(fund: InsertFund): Promise<Fund> {
    try {
      const result = await this.sql`
        INSERT INTO funds (name, type, project_id, balance, owner_id, created_at, updated_at)
        VALUES (${fund.name}, ${fund.type}, ${fund.projectId || null}, ${fund.balance || 0}, ${fund.ownerId || null}, NOW(), NOW())
        RETURNING *
      `;
      return result[0] as Fund;
    } catch (error) {
      console.error('Error creating fund:', error);
      throw error;
    }
  }

  async updateFundBalance(id: number, amount: number): Promise<Fund | undefined> {
    try {
      const result = await this.sql`
        UPDATE funds SET balance = balance + ${amount}, updated_at = NOW() WHERE id = ${id} RETURNING *
      `;
      return result[0] as Fund | undefined;
    } catch (error) {
      console.error('Error updating fund balance:', error);
      return undefined;
    }
  }

  async listFunds(): Promise<Fund[]> {
    try {
      const result = await this.sql`SELECT * FROM funds ORDER BY id`;
      return result as Fund[];
    } catch (error) {
      console.error('Error listing funds:', error);
      return [];
    }
  }

  async processDeposit(userId: number, projectId: number, amount: number, description: string): Promise<{ transaction: Transaction, adminFund?: Fund, projectFund?: Fund }> {
    try {
      // Create transaction
      const transaction = await this.createTransaction({
        date: new Date(),
        amount,
        type: "income",
        description,
        projectId,
        createdBy: userId
      });

      // Update fund balances if needed
      let adminFund, projectFund;
      
      if (projectId) {
        projectFund = await this.getFundByProject(projectId);
        if (projectFund) {
          projectFund = await this.updateFundBalance(projectFund.id, amount);
        }
      } else {
        adminFund = await this.getFundByOwner(userId);
        if (adminFund) {
          adminFund = await this.updateFundBalance(adminFund.id, amount);
        }
      }

      return { transaction, adminFund, projectFund };
    } catch (error) {
      console.error('Error processing deposit:', error);
      throw error;
    }
  }

  async processWithdrawal(userId: number, projectId: number, amount: number, description: string, expenseType?: string): Promise<{ transaction: Transaction, adminFund?: Fund, projectFund?: Fund }> {
    try {
      // Create transaction
      const transaction = await this.createTransaction({
        date: new Date(),
        amount,
        type: "expense",
        description,
        projectId,
        createdBy: userId,
        expenseType
      });

      // Update fund balances if needed
      let adminFund, projectFund;
      
      if (projectId) {
        projectFund = await this.getFundByProject(projectId);
        if (projectFund) {
          projectFund = await this.updateFundBalance(projectFund.id, -amount);
        }
      } else {
        adminFund = await this.getFundByOwner(userId);
        if (adminFund) {
          adminFund = await this.updateFundBalance(adminFund.id, -amount);
        }
      }

      return { transaction, adminFund, projectFund };
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      throw error;
    }
  }

  async processAdminTransaction(userId: number, type: string, amount: number, description: string): Promise<{ transaction: Transaction, adminFund?: Fund }> {
    try {
      // Create transaction
      const transaction = await this.createTransaction({
        date: new Date(),
        amount,
        type,
        description,
        projectId: null,
        createdBy: userId
      });

      // Update admin fund
      let adminFund = await this.getFundByOwner(userId);
      if (adminFund) {
        const updateAmount = type === "income" ? amount : -amount;
        adminFund = await this.updateFundBalance(adminFund.id, updateAmount);
      }

      return { transaction, adminFund };
    } catch (error) {
      console.error('Error processing admin transaction:', error);
      throw error;
    }
  }

  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    try {
      const result = await this.sql`SELECT * FROM documents WHERE id = ${id}`;
      return result[0] as Document | undefined;
    } catch (error) {
      console.error('Error getting document:', error);
      return undefined;
    }
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    try {
      const result = await this.sql`
        INSERT INTO documents (name, project_id, description, file_url, file_type, upload_date, uploaded_by, is_manager_document, category, tags)
        VALUES (${document.name}, ${document.projectId || null}, ${document.description || null}, ${document.fileUrl}, ${document.fileType}, ${document.uploadDate}, ${document.uploadedBy}, ${document.isManagerDocument || false}, ${document.category || null}, ${JSON.stringify(document.tags || {})})
        RETURNING *
      `;
      return result[0] as Document;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined> {
    try {
      const setParts = [];
      const values = [];
      
      if (document.name !== undefined) {
        setParts.push(`name = $${setParts.length + 1}`);
        values.push(document.name);
      }
      if (document.projectId !== undefined) {
        setParts.push(`project_id = $${setParts.length + 1}`);
        values.push(document.projectId);
      }
      if (document.description !== undefined) {
        setParts.push(`description = $${setParts.length + 1}`);
        values.push(document.description);
      }
      if (document.category !== undefined) {
        setParts.push(`category = $${setParts.length + 1}`);
        values.push(document.category);
      }
      if (document.tags !== undefined) {
        setParts.push(`tags = $${setParts.length + 1}`);
        values.push(JSON.stringify(document.tags));
      }
      if (document.isManagerDocument !== undefined) {
        setParts.push(`is_manager_document = $${setParts.length + 1}`);
        values.push(document.isManagerDocument);
      }

      if (setParts.length === 0) return this.getDocument(id);

      const query = `UPDATE documents SET ${setParts.join(', ')} WHERE id = $${setParts.length + 1} RETURNING *`;
      values.push(id);
      
      const result = await this.sql(query, values);
      return result[0] as Document | undefined;
    } catch (error) {
      console.error('Error updating document:', error);
      return undefined;
    }
  }

  async listDocuments(): Promise<Document[]> {
    try {
      const result = await this.sql`SELECT * FROM documents ORDER BY upload_date DESC`;
      return result as Document[];
    } catch (error) {
      console.error('Error listing documents:', error);
      return [];
    }
  }

  async getDocumentsByProject(projectId: number): Promise<Document[]> {
    try {
      const result = await this.sql`
        SELECT * FROM documents WHERE project_id = ${projectId} ORDER BY upload_date DESC
      `;
      return result as Document[];
    } catch (error) {
      console.error('Error getting documents by project:', error);
      return [];
    }
  }

  async deleteDocument(id: number): Promise<boolean> {
    try {
      const result = await this.sql`DELETE FROM documents WHERE id = ${id}`;
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  // Activity Logs
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    try {
      const result = await this.sql`
        INSERT INTO activity_logs (action, entity_type, entity_id, details, user_id, timestamp)
        VALUES (${log.action}, ${log.entityType}, ${log.entityId || null}, ${log.details || null}, ${log.userId}, NOW())
        RETURNING *
      `;
      return result[0] as ActivityLog;
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }
  }

  async listActivityLogs(): Promise<ActivityLog[]> {
    try {
      const result = await this.sql`SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100`;
      return result as ActivityLog[];
    } catch (error) {
      console.error('Error listing activity logs:', error);
      return [];
    }
  }

  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    try {
      const result = await this.sql`
        SELECT * FROM activity_logs WHERE user_id = ${userId} ORDER BY timestamp DESC LIMIT 100
      `;
      return result as ActivityLog[];
    } catch (error) {
      console.error('Error getting activity logs by user:', error);
      return [];
    }
  }

  async getActivityLogsByEntity(entityType: string, entityId: number): Promise<ActivityLog[]> {
    try {
      const result = await this.sql`
        SELECT * FROM activity_logs WHERE entity_type = ${entityType} AND entity_id = ${entityId} ORDER BY timestamp DESC
      `;
      return result as ActivityLog[];
    } catch (error) {
      console.error('Error getting activity logs by entity:', error);
      return [];
    }
  }

  // Settings
  async getSetting(key: string): Promise<Setting | undefined> {
    try {
      const result = await this.sql`SELECT * FROM settings WHERE key = ${key}`;
      return result[0] as Setting | undefined;
    } catch (error) {
      console.error('Error getting setting:', error);
      return undefined;
    }
  }

  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    try {
      const result = await this.sql`
        INSERT INTO settings (key, value) VALUES (${key}, ${value})
        ON CONFLICT (key) DO UPDATE SET value = ${value}
        RETURNING *
      `;
      return result[0] as Setting | undefined;
    } catch (error) {
      console.error('Error updating setting:', error);
      return undefined;
    }
  }

  async listSettings(): Promise<Setting[]> {
    try {
      const result = await this.sql`SELECT * FROM settings ORDER BY key`;
      return result as Setting[];
    } catch (error) {
      console.error('Error listing settings:', error);
      return [];
    }
  }

  // Placeholder implementations for other methods
  async getExpenseType(id: number): Promise<ExpenseType | undefined> {
    try {
      const result = await this.sql`SELECT * FROM expense_types WHERE id = ${id}`;
      return result[0] as ExpenseType | undefined;
    } catch (error) {
      console.error('Error getting expense type:', error);
      return undefined;
    }
  }

  async getExpenseTypeByName(name: string): Promise<ExpenseType | undefined> {
    try {
      const result = await this.sql`SELECT * FROM expense_types WHERE name = ${name}`;
      return result[0] as ExpenseType | undefined;
    } catch (error) {
      console.error('Error getting expense type by name:', error);
      return undefined;
    }
  }

  async createExpenseType(expenseType: InsertExpenseType): Promise<ExpenseType> {
    try {
      const result = await this.sql`
        INSERT INTO expense_types (name, description, account_category_id)
        VALUES (${expenseType.name}, ${expenseType.description || null}, ${expenseType.accountCategoryId || null})
        RETURNING *
      `;
      return result[0] as ExpenseType;
    } catch (error) {
      console.error('Error creating expense type:', error);
      throw error;
    }
  }

  async updateExpenseType(id: number, expenseType: Partial<ExpenseType>): Promise<ExpenseType | undefined> {
    try {
      const setParts = [];
      const values = [];
      
      if (expenseType.name !== undefined) {
        setParts.push(`name = $${setParts.length + 1}`);
        values.push(expenseType.name);
      }
      if (expenseType.description !== undefined) {
        setParts.push(`description = $${setParts.length + 1}`);
        values.push(expenseType.description);
      }
      if (expenseType.accountCategoryId !== undefined) {
        setParts.push(`account_category_id = $${setParts.length + 1}`);
        values.push(expenseType.accountCategoryId);
      }

      if (setParts.length === 0) return this.getExpenseType(id);

      const query = `UPDATE expense_types SET ${setParts.join(', ')} WHERE id = $${setParts.length + 1} RETURNING *`;
      values.push(id);
      
      const result = await this.sql(query, values);
      return result[0] as ExpenseType | undefined;
    } catch (error) {
      console.error('Error updating expense type:', error);
      return undefined;
    }
  }

  async listExpenseTypes(): Promise<ExpenseType[]> {
    try {
      const result = await this.sql`SELECT * FROM expense_types ORDER BY name`;
      return result as ExpenseType[];
    } catch (error) {
      console.error('Error listing expense types:', error);
      return [];
    }
  }

  async deleteExpenseType(id: number): Promise<boolean> {
    try {
      const result = await this.sql`DELETE FROM expense_types WHERE id = ${id}`;
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting expense type:', error);
      return false;
    }
  }

  async createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry> {
    try {
      const result = await this.sql`
        INSERT INTO ledger_entries (transaction_id, entry_type, account_name, debit_amount, credit_amount, project_id, expense_type_id, description, entry_date)
        VALUES (${entry.transactionId}, ${entry.entryType}, ${entry.accountName}, ${entry.debitAmount || 0}, ${entry.creditAmount || 0}, ${entry.projectId || null}, ${entry.expenseTypeId || null}, ${entry.description || null}, ${entry.entryDate})
        RETURNING *
      `;
      return result[0] as LedgerEntry;
    } catch (error) {
      console.error('Error creating ledger entry:', error);
      throw error;
    }
  }

  async updateLedgerEntry(id: number, entry: Partial<LedgerEntry>): Promise<LedgerEntry | undefined> {
    try {
      const setParts = [];
      const values = [];
      
      if (entry.entryType !== undefined) {
        setParts.push(`entry_type = $${setParts.length + 1}`);
        values.push(entry.entryType);
      }
      if (entry.accountName !== undefined) {
        setParts.push(`account_name = $${setParts.length + 1}`);
        values.push(entry.accountName);
      }
      if (entry.debitAmount !== undefined) {
        setParts.push(`debit_amount = $${setParts.length + 1}`);
        values.push(entry.debitAmount);
      }
      if (entry.creditAmount !== undefined) {
        setParts.push(`credit_amount = $${setParts.length + 1}`);
        values.push(entry.creditAmount);
      }
      if (entry.description !== undefined) {
        setParts.push(`description = $${setParts.length + 1}`);
        values.push(entry.description);
      }

      if (setParts.length === 0) return undefined;

      const query = `UPDATE ledger_entries SET ${setParts.join(', ')} WHERE id = $${setParts.length + 1} RETURNING *`;
      values.push(id);
      
      const result = await this.sql(query, values);
      return result[0] as LedgerEntry | undefined;
    } catch (error) {
      console.error('Error updating ledger entry:', error);
      return undefined;
    }
  }

  async getLedgerEntriesByType(entryType: string): Promise<LedgerEntry[]> {
    try {
      const result = await this.sql`
        SELECT * FROM ledger_entries WHERE entry_type = ${entryType} ORDER BY entry_date DESC
      `;
      return result as LedgerEntry[];
    } catch (error) {
      console.error('Error getting ledger entries by type:', error);
      return [];
    }
  }

  async getLedgerEntriesByProject(projectId: number): Promise<LedgerEntry[]> {
    try {
      const result = await this.sql`
        SELECT * FROM ledger_entries WHERE project_id = ${projectId} ORDER BY entry_date DESC
      `;
      return result as LedgerEntry[];
    } catch (error) {
      console.error('Error getting ledger entries by project:', error);
      return [];
    }
  }

  async getLedgerEntriesByExpenseType(expenseTypeId: number): Promise<LedgerEntry[]> {
    try {
      const result = await this.sql`
        SELECT * FROM ledger_entries WHERE expense_type_id = ${expenseTypeId} ORDER BY entry_date DESC
      `;
      return result as LedgerEntry[];
    } catch (error) {
      console.error('Error getting ledger entries by expense type:', error);
      return [];
    }
  }

  async listLedgerEntries(): Promise<LedgerEntry[]> {
    try {
      const result = await this.sql`SELECT * FROM ledger_entries ORDER BY entry_date DESC`;
      return result as LedgerEntry[];
    } catch (error) {
      console.error('Error listing ledger entries:', error);
      return [];
    }
  }

  async classifyExpenseTransaction(transaction: Transaction, forceClassify: boolean = false): Promise<void> {
    // Implementation for expense classification
    console.log(`PgStorage: Classifying transaction ${transaction.id} - ${transaction.description}`);
  }

  async getAccountCategory(id: number): Promise<AccountCategory | undefined> {
    try {
      const result = await this.sql`SELECT * FROM account_categories WHERE id = ${id}`;
      return result[0] as AccountCategory | undefined;
    } catch (error) {
      console.error('Error getting account category:', error);
      return undefined;
    }
  }

  async createAccountCategory(category: InsertAccountCategory): Promise<AccountCategory> {
    try {
      const result = await this.sql`
        INSERT INTO account_categories (name, description, category_type)
        VALUES (${category.name}, ${category.description || null}, ${category.categoryType})
        RETURNING *
      `;
      return result[0] as AccountCategory;
    } catch (error) {
      console.error('Error creating account category:', error);
      throw error;
    }
  }

  async updateAccountCategory(id: number, category: Partial<AccountCategory>): Promise<AccountCategory | undefined> {
    try {
      const setParts = [];
      const values = [];
      
      if (category.name !== undefined) {
        setParts.push(`name = $${setParts.length + 1}`);
        values.push(category.name);
      }
      if (category.description !== undefined) {
        setParts.push(`description = $${setParts.length + 1}`);
        values.push(category.description);
      }
      if (category.categoryType !== undefined) {
        setParts.push(`category_type = $${setParts.length + 1}`);
        values.push(category.categoryType);
      }

      if (setParts.length === 0) return this.getAccountCategory(id);

      const query = `UPDATE account_categories SET ${setParts.join(', ')} WHERE id = $${setParts.length + 1} RETURNING *`;
      values.push(id);
      
      const result = await this.sql(query, values);
      return result[0] as AccountCategory | undefined;
    } catch (error) {
      console.error('Error updating account category:', error);
      return undefined;
    }
  }

  async listAccountCategories(): Promise<AccountCategory[]> {
    try {
      const result = await this.sql`SELECT * FROM account_categories ORDER BY name`;
      return result as AccountCategory[];
    } catch (error) {
      console.error('Error listing account categories:', error);
      return [];
    }
  }

  async deleteAccountCategory(id: number): Promise<boolean> {
    try {
      const result = await this.sql`DELETE FROM account_categories WHERE id = ${id}`;
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting account category:', error);
      return false;
    }
  }

  async getDeferredPayment(id: number): Promise<DeferredPayment | undefined> {
    try {
      const result = await this.sql`SELECT * FROM deferred_payments WHERE id = ${id}`;
      return result[0] as DeferredPayment | undefined;
    } catch (error) {
      console.error('Error getting deferred payment:', error);
      return undefined;
    }
  }

  async createDeferredPayment(payment: InsertDeferredPayment): Promise<DeferredPayment> {
    try {
      const result = await this.sql`
        INSERT INTO deferred_payments (description, total_amount, paid_amount, remaining_amount, project_id, created_by, due_date, status)
        VALUES (${payment.description}, ${payment.totalAmount}, ${payment.paidAmount || 0}, ${payment.remainingAmount || payment.totalAmount}, ${payment.projectId || null}, ${payment.createdBy}, ${payment.dueDate || null}, ${payment.status || 'pending'})
        RETURNING *
      `;
      return result[0] as DeferredPayment;
    } catch (error) {
      console.error('Error creating deferred payment:', error);
      throw error;
    }
  }

  async updateDeferredPayment(id: number, payment: Partial<DeferredPayment>): Promise<DeferredPayment | undefined> {
    try {
      const setParts = [];
      const values = [];
      
      if (payment.description !== undefined) {
        setParts.push(`description = $${setParts.length + 1}`);
        values.push(payment.description);
      }
      if (payment.totalAmount !== undefined) {
        setParts.push(`total_amount = $${setParts.length + 1}`);
        values.push(payment.totalAmount);
      }
      if (payment.paidAmount !== undefined) {
        setParts.push(`paid_amount = $${setParts.length + 1}`);
        values.push(payment.paidAmount);
      }
      if (payment.remainingAmount !== undefined) {
        setParts.push(`remaining_amount = $${setParts.length + 1}`);
        values.push(payment.remainingAmount);
      }
      if (payment.status !== undefined) {
        setParts.push(`status = $${setParts.length + 1}`);
        values.push(payment.status);
      }
      if (payment.dueDate !== undefined) {
        setParts.push(`due_date = $${setParts.length + 1}`);
        values.push(payment.dueDate);
      }

      if (setParts.length === 0) return this.getDeferredPayment(id);

      const query = `UPDATE deferred_payments SET ${setParts.join(', ')} WHERE id = $${setParts.length + 1} RETURNING *`;
      values.push(id);
      
      const result = await this.sql(query, values);
      return result[0] as DeferredPayment | undefined;
    } catch (error) {
      console.error('Error updating deferred payment:', error);
      return undefined;
    }
  }

  async listDeferredPayments(): Promise<DeferredPayment[]> {
    try {
      const result = await this.sql`SELECT * FROM deferred_payments ORDER BY created_at DESC`;
      return result as DeferredPayment[];
    } catch (error) {
      console.error('Error listing deferred payments:', error);
      return [];
    }
  }

  async deleteDeferredPayment(id: number): Promise<boolean> {
    try {
      const result = await this.sql`DELETE FROM deferred_payments WHERE id = ${id}`;
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting deferred payment:', error);
      return false;
    }
  }

  async payDeferredPaymentInstallment(id: number, amount: number, userId: number): Promise<{ payment: DeferredPayment; transaction?: Transaction }> {
    try {
      const payment = await this.getDeferredPayment(id);
      if (!payment) throw new Error('Deferred payment not found');

      const newPaidAmount = payment.paidAmount + amount;
      const newRemainingAmount = payment.totalAmount - newPaidAmount;
      const newStatus = newRemainingAmount <= 0 ? 'completed' : 'partial';

      const updatedPayment = await this.updateDeferredPayment(id, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus
      });

      let transaction;
      if (payment.projectId) {
        const result = await this.processWithdrawal(userId, payment.projectId, amount, `دفع قسط من: ${payment.description}`);
        transaction = result.transaction;
      }

      return { payment: updatedPayment!, transaction };
    } catch (error) {
      console.error('Error paying deferred payment installment:', error);
      throw error;
    }
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    try {
      const result = await this.sql`SELECT * FROM employees WHERE id = ${id}`;
      return result[0] as Employee | undefined;
    } catch (error) {
      console.error('Error getting employee:', error);
      return undefined;
    }
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    try {
      const result = await this.sql`
        INSERT INTO employees (name, position, salary, project_id, hire_date, status, contact_info)
        VALUES (${employee.name}, ${employee.position}, ${employee.salary}, ${employee.projectId || null}, ${employee.hireDate}, ${employee.status || 'active'}, ${JSON.stringify(employee.contactInfo || {})})
        RETURNING *
      `;
      return result[0] as Employee;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee> {
    try {
      const setParts = [];
      const values = [];
      
      if (employee.name !== undefined) {
        setParts.push(`name = $${setParts.length + 1}`);
        values.push(employee.name);
      }
      if (employee.position !== undefined) {
        setParts.push(`position = $${setParts.length + 1}`);
        values.push(employee.position);
      }
      if (employee.salary !== undefined) {
        setParts.push(`salary = $${setParts.length + 1}`);
        values.push(employee.salary);
      }
      if (employee.projectId !== undefined) {
        setParts.push(`project_id = $${setParts.length + 1}`);
        values.push(employee.projectId);
      }
      if (employee.status !== undefined) {
        setParts.push(`status = $${setParts.length + 1}`);
        values.push(employee.status);
      }
      if (employee.contactInfo !== undefined) {
        setParts.push(`contact_info = $${setParts.length + 1}`);
        values.push(JSON.stringify(employee.contactInfo));
      }

      if (setParts.length === 0) throw new Error('No fields to update');

      const query = `UPDATE employees SET ${setParts.join(', ')} WHERE id = $${setParts.length + 1} RETURNING *`;
      values.push(id);
      
      const result = await this.sql(query, values);
      return result[0] as Employee;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  async getEmployees(): Promise<Employee[]> {
    try {
      const result = await this.sql`SELECT * FROM employees ORDER BY name`;
      return result as Employee[];
    } catch (error) {
      console.error('Error getting employees:', error);
      return [];
    }
  }

  async deleteEmployee(id: number): Promise<boolean> {
    try {
      const result = await this.sql`DELETE FROM employees WHERE id = ${id}`;
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting employee:', error);
      return false;
    }
  }

  async getEmployeesByProject(projectId: number): Promise<Employee[]> {
    try {
      const result = await this.sql`
        SELECT * FROM employees WHERE project_id = ${projectId} ORDER BY name
      `;
      return result as Employee[];
    } catch (error) {
      console.error('Error getting employees by project:', error);
      return [];
    }
  }

  async getActiveEmployees(): Promise<Employee[]> {
    try {
      const result = await this.sql`
        SELECT * FROM employees WHERE status = 'active' ORDER BY name
      `;
      return result as Employee[];
    } catch (error) {
      console.error('Error getting active employees:', error);
      return [];
    }
  }
}

export const pgStorage = new PgStorage();