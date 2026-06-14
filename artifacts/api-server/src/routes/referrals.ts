import { Router } from "express";
import { db, referralsTable, usersTable } from "@workspace/db";
import { eq, sum, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/referrals", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const refs = await db.select().from(referralsTable).where(eq(referralsTable.referrerId, userId));

  const result = await Promise.all(refs.map(async (r) => {
    const referred = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, r.referredUserId)).limit(1);
    return {
      id: r.id,
      referrerId: r.referrerId,
      referredUserId: r.referredUserId,
      referredUserName: referred[0]?.fullName ?? "Utilisateur",
      status: r.status,
      reward: r.reward ? Number(r.reward) : null,
      createdAt: r.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

router.get("/referrals/stats", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const refs = await db.select().from(referralsTable).where(eq(referralsTable.referrerId, userId));

  const totalReferrals = refs.length;
  const confirmedReferrals = refs.filter(r => r.status === "confirmed" || r.status === "rewarded").length;
  const totalRewards = refs.reduce((sum, r) => sum + (r.reward ? Number(r.reward) : 0), 0);
  const pendingRewards = refs.filter(r => r.status === "pending").reduce((sum, r) => sum + (r.reward ? Number(r.reward) : 0), 0);

  res.json({ totalReferrals, confirmedReferrals, totalRewards, pendingRewards });
});

export default router;
