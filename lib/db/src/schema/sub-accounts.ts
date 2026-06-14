import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subAccountStatusEnum = pgEnum("sub_account_status", ["active", "suspended"]);

export const subAccountsTable = pgTable("sub_accounts", {
  id: serial("id").primaryKey(),
  parentUserId: integer("parent_user_id").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  permissions: text("permissions").array().notNull().default([]),
  status: subAccountStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubAccountSchema = createInsertSchema(subAccountsTable).omit({ id: true, createdAt: true });
export type InsertSubAccount = z.infer<typeof insertSubAccountSchema>;
export type SubAccount = typeof subAccountsTable.$inferSelect;
