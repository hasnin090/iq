import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Determine dialect based on DATABASE_URL
const isSQLite = process.env.DATABASE_URL.startsWith('sqlite:');
const isPostgreSQL = process.env.DATABASE_URL.startsWith('postgresql:');

export default defineConfig({
  out: "./migrations",
  schema: isSQLite ? "./shared/schema-sqlite.ts" : "./shared/schema.ts",
  dialect: isSQLite ? "sqlite" : "postgresql",
  dbCredentials: isSQLite 
    ? { url: process.env.DATABASE_URL.replace('sqlite:', '') }
    : { url: process.env.DATABASE_URL },
});
