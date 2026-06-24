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
  transactionType: text("transaction_type").notNull().default("virement"),
  status: transferStatusEnum("status").notNull().default("pending"),
  accessType: accessTypeEnum("access_type").notNull().default("public"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  reference: text("reference").notNull().unique(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

  // Sender info
  senderFirstName: text("sender_first_name"),
  senderLastName: text("sender_last_name"),
  senderCountry: text("sender_country"),
  senderCity: text("sender_city"),

  // Receiver info
  receiverFirstName: text("receiver_first_name"),
  receiverLastName: text("receiver_last_name"),
  receiverEmail: text("receiver_email"),
  receiverCountry: text("receiver_country"),
  receiverCity: text("receiver_city"),

  // Display currency (amount stored in EUR, displayed in this currency)
  displayCurrency: text("display_currency").notNull().default("EUR"),

  // Payment methods (JSON array: ["card","paypal","mobile_money"])
  paymentMethods: text("payment_methods"),

  // Withdrawal block reason (configured by admin at creation)
  blockReason: text("block_reason"),

  // WhatsApp number for admin contact
  whatsappNumber: text("whatsapp_number"),
});

export const insertTransferSchema = createInsertSchema(transfersTable).omit({ id: true, createdAt: true });
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transfersTable.$inferSelect;
