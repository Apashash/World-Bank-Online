import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documentTypeEnum = pgEnum("document_type", ["id_card", "passport", "driving_license"]);
export const kycSubmissionStatusEnum = pgEnum("kyc_submission_status", ["pending", "verified", "rejected"]);

export const kycTable = pgTable("kyc", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  documentType: documentTypeEnum("document_type").notNull(),
  documentNumber: text("document_number"),
  documentFrontUrl: text("document_front_url"),
  documentBackUrl: text("document_back_url"),
  selfieUrl: text("selfie_url"),
  status: kycSubmissionStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const insertKycSchema = createInsertSchema(kycTable).omit({ id: true, submittedAt: true });
export type InsertKyc = z.infer<typeof insertKycSchema>;
export type Kyc = typeof kycTable.$inferSelect;
