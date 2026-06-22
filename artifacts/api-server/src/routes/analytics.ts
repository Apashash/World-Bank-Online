import { Router } from "express";
import { db, transfersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const CATEGORIES = [
  "logement",
  "alimentation",
  "santé",
  "transport",
  "loisirs",
  "éducation",
  "autres",
] as const;

router.get("/analytics/categories", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;

  const transfers = await db.select({
    category: transfersTable.category,
    amount: transfersTable.amount,
    status: transfersTable.status,
    currency: transfersTable.currency,
    createdAt: transfersTable.createdAt,
  })
    .from(transfersTable)
    .where(eq(transfersTable.userId, userId))
    .orderBy(desc(transfersTable.createdAt));

  const categoryMap: Record<string, { total: number; count: number; currency: string }> = {};

  for (const t of transfers) {
    const cat = t.category || "autres";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { total: 0, count: 0, currency: t.currency };
    }
    categoryMap[cat].total += Number(t.amount);
    categoryMap[cat].count += 1;
  }

  const breakdown = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    total: Math.round(data.total * 100) / 100,
    count: data.count,
    currency: data.currency,
  }));

  const total = breakdown.reduce((s, b) => s + b.total, 0);

  res.json({
    breakdown,
    total: Math.round(total * 100) / 100,
    currency: transfers[0]?.currency ?? "EUR",
  });
});

export default router;
