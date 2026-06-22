import { pgTable, serial, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const scheduledStatusEnum = pgEnum("scheduled_status", ["pending", "executed", "cancelled", "failed"]);

export const scheduledTransfersTable = pgTable("scheduled_transfers", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  beneficiaryName: text("beneficiary_name").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("EUR"),
  message: text("message"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: scheduledStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ScheduledTransfer = typeof scheduledTransfersTable.$inferSelect;
