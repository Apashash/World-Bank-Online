import { Router } from "express";
import { db, usersTable, transfersTable, subAccountsTable, activityTable, referralsTable } from "@workspace/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;

  const [users, transferStats, subAccountStats, referralStats] = await Promise.all([
    db.select({
      balance: usersTable.balance,
      currency: usersTable.currency,
      kycStatus: usersTable.kycStatus,
      iban: usersTable.iban,
    }).from(usersTable).where(eq(usersTable.id, userId)).limit(1),

    db.select({
      total:        sql<number>`count(*)::int`,
      completed:    sql<number>`count(*) filter (where ${transfersTable.status} = 'completed')::int`,
      pending:      sql<number>`count(*) filter (where ${transfersTable.status} = 'pending')::int`,
      sumAll:       sql<number>`coalesce(sum(${transfersTable.amount}::numeric), 0)::float`,
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

  res.setHeader("Cache-Control", "private, max-age=30");
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

  const activities = await db.select({
    id: activityTable.id,
    type: activityTable.type,
    description: activityTable.description,
    amount: activityTable.amount,
    currency: activityTable.currency,
    createdAt: activityTable.createdAt,
  }).from(activityTable)
    .where(eq(activityTable.userId, userId))
    .orderBy(desc(activityTable.createdAt))
    .limit(20);

  res.setHeader("Cache-Control", "private, max-age=30");
  res.json(activities.map(a => ({
    id: a.id,
    type: a.type,
    description: a.description,
    amount: a.amount ? Number(a.amount) : null,
    currency: a.currency ?? null,
    createdAt: a.createdAt.toISOString(),
  })));
});

// Graphique hebdomadaire pré-agrégé — remplace le chargement de 100 virements côté client
router.get("/dashboard/weekly-chart", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const rows = await db.select({
    weekStart: sql<string>`date_trunc('week', ${transfersTable.createdAt} AT TIME ZONE 'UTC')::text`,
    sent:      sql<number>`coalesce(sum(${transfersTable.amount}::numeric), 0)::float`,
    received:  sql<number>`coalesce(sum(${transfersTable.amount}::numeric) filter (where ${transfersTable.status} = 'completed'), 0)::float`,
  })
    .from(transfersTable)
    .where(and(
      eq(transfersTable.userId, userId),
      gte(transfersTable.createdAt, fourWeeksAgo),
    ))
    .groupBy(sql`date_trunc('week', ${transfersTable.createdAt} AT TIME ZONE 'UTC')`)
    .orderBy(sql`date_trunc('week', ${transfersTable.createdAt} AT TIME ZONE 'UTC')`);

  // Construire les 4 semaines (lundi → dimanche) avec labels
  const weeks: { label: string; sent: number; received: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    // lundi de la semaine
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().slice(0, 10);

    const row = rows.find(r => r.weekStart.slice(0, 10) === weekKey);
    weeks.push({
      label: `Semaine ${4 - i}`,
      sent: row ? Math.round(row.sent) : 0,
      received: row ? Math.round(row.received * 0.3) : 0,
    });
  }

  res.setHeader("Cache-Control", "private, max-age=60");
  res.json(weeks);
});

export default router;
