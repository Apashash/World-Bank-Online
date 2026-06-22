import { pgTable, text, serial, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transferStatusEnum = pgEnum("transfer_status", ["pending", "completed", "cancelled", "expired"]);
export const accessTypeEnum = pgEnum("access_type", ["public", "private", "limited"]);

export const transfersTable = pgTable("transfers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  beneficiaryName: text("beneficiary_name").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("EUR"),
  message: text("message"),
  category: text("category"),
  status: transferStatusEnum("status").notNull().default("pending"),
  accessType: accessTypeEnum("access_type").notNull().default("public"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  reference: text("reference").notNull().unique(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransferSchema = createInsertSchema(transfersTable).omit({ id: true, createdAt: true });
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transfersTable.$inferSelect;
