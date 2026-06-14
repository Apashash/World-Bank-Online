import { pgTable, text, serial, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userStatusEnum = pgEnum("user_status", ["active", "blocked", "pending"]);
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const kycStatusEnum = pgEnum("kyc_status", ["none", "pending", "verified", "rejected"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  country: text("country").notNull(),
  passwordHash: text("password_hash").notNull(),
  balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0.00"),
  currency: text("currency").notNull().default("EUR"),
  status: userStatusEnum("status").notNull().default("active"),
  role: userRoleEnum("role").notNull().default("user"),
  referralCode: text("referral_code").notNull().unique(),
  kycStatus: kycStatusEnum("kyc_status").notNull().default("none"),
  iban: text("iban"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
