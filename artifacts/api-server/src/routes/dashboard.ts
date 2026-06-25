import { Router } from "express";
import { db, usersTable, transfersTable, subAccountsTable, activityTable, referralsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;

  // Toutes les requêtes en parallèle — 4x plus rapide
  const [users, transferStats, subAccountStats, referralStats] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1),

    db.select({
      total:     sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${transfersTable.status} = 'completed')::int`,
      pending:   sql<number>`count(*) filter (where ${transfersTable.status} = 'pending')::int`,
      sumAll:    sql<number>`coalesce(sum(${transfersTable.amount}::numeric), 0)::float`,
      sumCompleted: sql<number>`coalesce(sum(${transfersTable.amount}::numeric) filter (where ${transfersTable.status} = 'completed'), 0)::float`,
    }).from(transfersTable).where(eq(transfersTable.userId, userId)),

    db.select({
      active: sql<number>`count(*) filter (where ${subAccountsTable.status} = 'active')::int`,
    }).from(subAccountsTable).where(eq(subAccountsTable.parentUserId, userId)),

    db.select({
      count: sql<number>`count(*)::int`,
    }).from(referralsTable).where(eq(referralsTable.referrerId, userId)),
  ]);

  if (users.length === 0) { res.status(404).json({ error: "User not found" }); return; }
  const user = users[0];
  const t = transferStats[0];

  res.json({
    balance: Number(user.balance),
    currency: user.currency,
    totalTransfersSent: t.total,
    totalTransfersReceived: t.completed,
    totalAmountSent: t.sumAll,
    totalAmountReceived: t.sumCompleted,
    pendingTransfers: t.pending,
    activeSubAccounts: subAccountStats[0].active,
    kycStatus: user.kycStatus,
    iban: user.iban ?? null,
    referralsCount: referralStats[0].count,
  });
});

router.get("/dashboard/activity", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;

  const activities = await db.select().from(activityTable)
    .where(eq(activityTable.userId, userId))
    .orderBy(desc(activityTable.createdAt))
    .limit(20);

  res.json(activities.map(a => ({
    id: a.id,
    type: a.type,
    description: a.description,
    amount: a.amount ? Number(a.amount) : null,
    currency: a.currency ?? null,
    createdAt: a.createdAt.toISOString(),
  })));
});

export default router;
