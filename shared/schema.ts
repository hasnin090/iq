import { pgTable, text, serial, integer, boolean, timestamp, jsonb, unique, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// تعريف قيم وأنواع الأدوار والصلاحيات للاستخدام في التطبيق
// ملاحظة: نحتفظ بهذه الأنواع كمرجع ولكن لا ننشئ الجداول الآن بسبب قيود الترحيل

// قائمة الأدوار المتاحة (للاستخدام البرمجي فقط، لا تنشئ جدولاً)
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer'
} as const;

// قائمة الصلاحيات المتاحة (للاستخدام البرمجي فقط، لا تنشئ جدولاً)
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  MANAGE_PROJECTS: 'manage_projects',
  VIEW_PROJECTS: 'view_projects',
  MANAGE_PROJECT_TRANSACTIONS: 'manage_project_transactions',
  VIEW_PROJECT_TRANSACTIONS: 'view_project_transactions',
  MANAGE_TRANSACTIONS: 'manage_transactions',
  VIEW_TRANSACTIONS: 'view_transactions',
  MANAGE_DOCUMENTS: 'manage_documents',
  VIEW_DOCUMENTS: 'view_documents',
  VIEW_REPORTS: 'view_reports',
  VIEW_ACTIVITY_LOGS: 'view_activity_logs',
  MANAGE_SETTINGS: 'manage_settings'
} as const;

// Users table - نستخدم البنية الحالية
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").unique(),
  role: text("role").notNull().default("user"), // admin, user, manager, viewer
  permissions: jsonb("permissions").default([]).notNull(),
  active: boolean("active").notNull().default(true),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  status: text("status").notNull().default("active"), // active, completed, paused
  progress: integer("progress").notNull().default(0),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // income, expense
  description: text("description").notNull(),
  projectId: integer("project_id").references(() => projects.id),
  createdBy: integer("created_by").notNull().references(() => users.id),
  fileUrl: text("file_url"), // URL للملف المرفق (اختياري)
  fileType: text("file_type"), // نوع الملف المرفق (اختياري)
});

// UserProjects table - for managing user project assignments
export const userProjects = pgTable("user_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  assignedBy: integer("assigned_by").notNull().references(() => users.id),
}, (table) => {
  return {
    userProjectUnique: unique().on(table.userId, table.projectId),
  };
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  uploadDate: timestamp("upload_date").notNull(),
  projectId: integer("project_id").references(() => projects.id),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  isManagerDocument: boolean("is_manager_document").default(false), // إضافة حقل للإشارة إلى المستندات الإدارية
});

// Activity Logs table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(), // create, update, delete
  entityType: text("entity_type").notNull(), // transaction, project, user, document
  entityId: integer("entity_id").notNull(),
  details: text("details").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  userId: integer("user_id").notNull().references(() => users.id),
});

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
});

// نوع الصندوق: صندوق المدير أو صندوق مشروع
export const fundTypeEnum = pgEnum('fund_type', ['admin', 'project']);

// Funds table - لإدارة الصناديق والأرصدة
export const funds = pgTable("funds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  balance: integer("balance").notNull().default(0),
  type: fundTypeEnum("type").notNull(),
  ownerId: integer("owner_id").references(() => users.id), // لصندوق المدير
  projectId: integer("project_id").references(() => projects.id), // لصندوق المشروع
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insertion schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true })
  .extend({
    password: z.string().min(6, "كلمة المرور يجب أن تحتوي على الأقل 6 أحرف"),
    email: z.string().email("البريد الإلكتروني غير صالح").optional(),
    projectId: z.number().optional(), // إضافة حقل projectId كخاصية إضافية لا تتطابق مع الجدول
    permissions: z.array(z.string()).optional(), // صلاحيات المستخدم
  });

export const insertProjectSchema = createInsertSchema(projects)
  .omit({ id: true, progress: true })
  .extend({
    startDate: z.coerce.date(), // تحويل التاريخ تلقائياً من السلسلة النصية
    createdBy: z.number().optional(), // سيتم تعيينه في الخلفية
  });

export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({ id: true })
  .extend({
    date: z.coerce.date(), // تحويل التاريخ تلقائياً من السلسلة النصية
    createdBy: z.number().optional(), // سيتم تعيينه في الخلفية
  });

export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true })
  .extend({
    isManagerDocument: z.boolean().optional().default(false),
  });

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, timestamp: true });

export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });

export const insertUserProjectSchema = createInsertSchema(userProjects).omit({ id: true, assignedAt: true });

export const insertFundSchema = createInsertSchema(funds)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    type: z.enum(['admin', 'project']),
  });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

export type InsertUserProject = z.infer<typeof insertUserProjectSchema>;
export type UserProject = typeof userProjects.$inferSelect;

export type InsertFund = z.infer<typeof insertFundSchema>;
export type Fund = typeof funds.$inferSelect;

// Permission types
export type Permission = keyof typeof PERMISSIONS;
export type Role = keyof typeof ROLES;

// Auth types
export const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
