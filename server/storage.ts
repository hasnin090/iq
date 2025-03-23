import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  transactions, type Transaction, type InsertTransaction,
  documents, type Document, type InsertDocument,
  activityLogs, type ActivityLog, type InsertActivityLog,
  settings, type Setting, type InsertSetting
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;
  validatePassword(storedPassword: string, inputPassword: string): Promise<boolean>;

  // Projects
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  listProjects(): Promise<Project[]>;
  deleteProject(id: number): Promise<boolean>;

  // Transactions
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction | undefined>;
  listTransactions(): Promise<Transaction[]>;
  getTransactionsByProject(projectId: number): Promise<Transaction[]>;
  deleteTransaction(id: number): Promise<boolean>;

  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined>;
  listDocuments(): Promise<Document[]>;
  getDocumentsByProject(projectId: number): Promise<Document[]>;
  deleteDocument(id: number): Promise<boolean>;

  // ActivityLogs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  listActivityLogs(): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: number): Promise<ActivityLog[]>;
  getActivityLogsByEntity(entityType: string, entityId: number): Promise<ActivityLog[]>;

  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<Setting | undefined>;
  listSettings(): Promise<Setting[]>;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private projectsData: Map<number, Project>;
  private transactionsData: Map<number, Transaction>;
  private documentsData: Map<number, Document>;
  private activityLogsData: Map<number, ActivityLog>;
  private settingsData: Map<number, Setting>;
  private userIdCounter: number;
  private projectIdCounter: number;
  private transactionIdCounter: number;
  private documentIdCounter: number;
  private activityLogIdCounter: number;
  private settingIdCounter: number;

  constructor() {
    this.usersData = new Map();
    this.projectsData = new Map();
    this.transactionsData = new Map();
    this.documentsData = new Map();
    this.activityLogsData = new Map();
    this.settingsData = new Map();
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.transactionIdCounter = 1;
    this.documentIdCounter = 1;
    this.activityLogIdCounter = 1;
    this.settingIdCounter = 1;

    // Add default admin user
    this.createUser({
      username: "admin",
      password: bcrypt.hashSync("admin123", 10),
      name: "مدير النظام",
      email: "admin@example.com",
      role: "admin"
    });

    // Add default settings
    this.settingsData.set(1, {
      id: this.settingIdCounter++,
      key: "companyName",
      value: "شركة تقنية للمقاولات",
      description: "اسم الشركة"
    });
    this.settingsData.set(2, {
      id: this.settingIdCounter++,
      key: "currency",
      value: "د.ع",
      description: "رمز العملة"
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { 
      ...user, 
      id,
      permissions: user.permissions || [],
      active: true
    };
    this.usersData.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...userData };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.usersData.values());
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersData.delete(id);
  }

  async validatePassword(storedPassword: string, inputPassword: string): Promise<boolean> {
    return bcrypt.compareSync(inputPassword, storedPassword);
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    return this.projectsData.get(id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const newProject: Project = { ...project, id, progress: 0 };
    this.projectsData.set(id, newProject);
    return newProject;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const project = this.projectsData.get(id);
    if (!project) return undefined;
    
    const updatedProject: Project = { ...project, ...projectData };
    this.projectsData.set(id, updatedProject);
    return updatedProject;
  }

  async listProjects(): Promise<Project[]> {
    return Array.from(this.projectsData.values());
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projectsData.delete(id);
  }

  // Transactions
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactionsData.get(id);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const newTransaction: Transaction = { ...transaction, id };
    this.transactionsData.set(id, newTransaction);
    return newTransaction;
  }

  async updateTransaction(id: number, transactionData: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactionsData.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction: Transaction = { ...transaction, ...transactionData };
    this.transactionsData.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async listTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactionsData.values());
  }

  async getTransactionsByProject(projectId: number): Promise<Transaction[]> {
    return Array.from(this.transactionsData.values()).filter(
      (transaction) => transaction.projectId === projectId
    );
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactionsData.delete(id);
  }

  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documentsData.get(id);
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.documentIdCounter++;
    const newDocument: Document = { ...document, id };
    this.documentsData.set(id, newDocument);
    return newDocument;
  }

  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined> {
    const document = this.documentsData.get(id);
    if (!document) return undefined;
    
    const updatedDocument: Document = { ...document, ...documentData };
    this.documentsData.set(id, updatedDocument);
    return updatedDocument;
  }

  async listDocuments(): Promise<Document[]> {
    return Array.from(this.documentsData.values());
  }

  async getDocumentsByProject(projectId: number): Promise<Document[]> {
    return Array.from(this.documentsData.values()).filter(
      (document) => document.projectId === projectId
    );
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documentsData.delete(id);
  }

  // ActivityLogs
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const newLog: ActivityLog = { 
      ...log, 
      id, 
      timestamp: log.timestamp || new Date()
    };
    this.activityLogsData.set(id, newLog);
    return newLog;
  }

  async listActivityLogs(): Promise<ActivityLog[]> {
    return Array.from(this.activityLogsData.values());
  }

  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogsData.values()).filter(
      (log) => log.userId === userId
    );
  }

  async getActivityLogsByEntity(entityType: string, entityId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogsData.values()).filter(
      (log) => log.entityType === entityType && log.entityId === entityId
    );
  }

  // Settings
  async getSetting(key: string): Promise<Setting | undefined> {
    return Array.from(this.settingsData.values()).find(
      (setting) => setting.key === key
    );
  }

  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    const setting = Array.from(this.settingsData.values()).find(
      (s) => s.key === key
    );
    
    if (!setting) return undefined;
    
    const updatedSetting: Setting = { ...setting, value };
    this.settingsData.set(setting.id, updatedSetting);
    return updatedSetting;
  }

  async listSettings(): Promise<Setting[]> {
    return Array.from(this.settingsData.values());
  }
}

export const storage = new MemStorage();
