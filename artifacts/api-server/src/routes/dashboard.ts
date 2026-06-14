import { Router } from "express";
import { db, usersTable, transfersTable, subAccountsTable, activityTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (users.length === 0) { res.status(404).json({ error: "User not found" }); return; }
  const user = users[0];

  const allTransfers = await db.select().from(transfersTable).where(eq(transfersTable.userId, userId));
  const sentTransfers = allTransfers;
  const totalAmountSent = sentTransfers.reduce((s, t) => s + Number(t.amount), 0);
  const pendingTransfers = sentTransfers.filter(t => t.status === "pending").length;

  const subAccounts = await db.select().from(subAccountsTable).where(eq(subAccountsTable.parentUserId, userId));
  const activeSubAccounts = subAccounts.filter(s => s.status === "active").length;

  res.json({
    balance: Number(user.balance),
    currency: user.currency,
    totalTransfersSent: sentTransfers.length,
    totalTransfersReceived: 0,
    totalAmountSent,
    totalAmountReceived: 0,
    pendingTransfers,
    activeSubAccounts,
    kycStatus: user.kycStatus,
    iban: user.iban ?? null,
  });
});

router.get("/dashboard/activity", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;

  const activities = await db.select().from(activityTable)
    .where(eq(activityTable.userId, userId))
    .orderBy(activityTable.createdAt)
    .limit(20);

  res.json(activities.map(a => ({
    id: a.id,
    type: a.type,
    description: a.description,
    amount: a.amount ? Number(a.amount) : null,
    currency: a.currency ?? null,
    createdAt: a.createdAt.toISOString(),
  })).reverse());
});

export default router;
