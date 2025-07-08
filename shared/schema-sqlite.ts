import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for SQLite
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role").notNull().default("user"),
  permissions: text("permissions").default("[]").notNull(), // JSON as text in SQLite
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Projects table for SQLite
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  budget: text("budget"), // Store as text for precision
});

// Transactions table for SQLite
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").references(() => projects.id),
  description: text("description").notNull(),
  amount: text("amount").notNull(), // Store as text for precision
  type: text("type").notNull(), // income, expense
  category: text("category"),
  date: text("date").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertProjectSchema = createInsertSchema(projects);
export const insertTransactionSchema = createInsertSchema(transactions);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
