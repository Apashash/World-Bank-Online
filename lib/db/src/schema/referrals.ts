import { pgTable, serial, timestamp, integer, numeric, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const referralStatusEnum = pgEnum("referral_status", ["pending", "confirmed", "rewarded"]);

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(),
  referredUserId: integer("referred_user_id").notNull().unique(),
  status: referralStatusEnum("status").notNull().default("pending"),
  reward: numeric("reward", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("referrals_referrer_id_idx").on(table.referrerId),
]);

export const insertReferralSchema = createInsertSchema(referralsTable).omit({ id: true, createdAt: true });
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referralsTable.$inferSelect;
