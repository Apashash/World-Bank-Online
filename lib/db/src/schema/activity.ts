import { pgTable, text, serial, timestamp, integer, numeric, pgEnum, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityTypeEnum = pgEnum("activity_type", [
  "transfer_sent",
  "transfer_received",
  "transfer_confirmed",
  "sub_account_created",
  "kyc_updated",
  "login",
  "referral_joined",
  "deposit",
  "withdrawal",
  "bill_payment",
]);

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: activityTypeEnum("type").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }),
  currency: text("currency"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  isRead: boolean("is_read").notNull().default(false),
  referenceId: integer("reference_id"),
}, (table) => [
  index("activity_user_id_idx").on(table.userId),
  index("activity_user_id_created_at_idx").on(table.userId, table.createdAt),
]);

export const insertActivitySchema = createInsertSchema(activityTable).omit({ id: true, createdAt: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activityTable.$inferSelect;
