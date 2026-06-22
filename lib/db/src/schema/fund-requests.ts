import { pgTable, serial, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const fundRequestStatusEnum = pgEnum("fund_request_status", ["pending", "paid", "cancelled", "expired"]);

export const fundRequestsTable = pgTable("fund_requests", {
  id: serial("id").primaryKey(),
  fromUserId: serial("from_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  toEmail: text("to_email").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("EUR"),
  message: text("message"),
  token: text("token").notNull().unique(),
  status: fundRequestStatusEnum("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FundRequest = typeof fundRequestsTable.$inferSelect;
