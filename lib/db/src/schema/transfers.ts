import { pgTable, text, serial, timestamp, numeric, integer, boolean, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transferStatusEnum = pgEnum("transfer_status", ["pending", "completed", "cancelled", "expired"]);
export const accessTypeEnum = pgEnum("access_type", ["public", "private", "limited"]);

export const transfersTable = pgTable("transfers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
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

  // Receiver bank account number / RIB / IBAN
  receiverAccountNumber: text("receiver_account_number"),

  // Receiver bank (single bank selected by admin for the account number)
  receiverBankId: text("receiver_bank_id"),
  receiverBankLabel: text("receiver_bank_label"),

  // Payment methods (JSON array of IDs: ["carte_bancaire","paypal",…])
  paymentMethods: text("payment_methods"),

  // Payment method labels (JSON array of display names: ["BNP Paribas","PayPal",…])
  paymentMethodLabels: text("payment_method_labels"),

  // Withdrawal block reason (configured by admin at creation)
  blockReason: text("block_reason"),

  // WhatsApp number for admin contact
  whatsappNumber: text("whatsapp_number"),

  // Admin must explicitly unlock the withdrawal before receiver can proceed
  adminUnlocked: boolean("admin_unlocked").notNull().default(false),
  adminUnlockedAt: timestamp("admin_unlocked_at", { withTimezone: true }),
}, (table) => [
  index("transfers_user_id_idx").on(table.userId),
  index("transfers_created_at_idx").on(table.createdAt),
  index("transfers_status_idx").on(table.status),
  index("transfers_user_id_created_at_idx").on(table.userId, table.createdAt),
]);

export const insertTransferSchema = createInsertSchema(transfersTable).omit({ id: true, createdAt: true });
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transfersTable.$inferSelect;
