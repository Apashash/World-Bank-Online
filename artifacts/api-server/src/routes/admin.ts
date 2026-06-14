import { Router } from "express";
import { db, usersTable, transfersTable, kycTable, subAccountsTable, referralsTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { AdminBlockUserBody, AdminUpdateBalanceBody, AdminReviewKycBody } from "@workspace/api-zod";
import { formatUser } from "./auth";
import { formatKyc } from "./kyc";

const router = Router();

router.get("/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const { page = "1", limit = "20", search, status } = req.query as Record<string, string>;

  let allUsers = await db.select().from(usersTable);

  if (search) {
    const s = search.toLowerCase();
    allUsers = allUsers.filter(u => u.fullName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.clientId.toLowerCase().includes(s));
  }
  if (status) {
    allUsers = allUsers.filter(u => u.status === status);
  }

  const p = parseInt(page), l = parseInt(limit);
  const paginated = allUsers.slice((p - 1) * l, p * l);
  res.json({ users: paginated.map(formatUser), total: allUsers.length, page: p, limit: l });
});

router.patch("/admin/users/:id/block", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const parsed = AdminBlockUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const [updated] = await db.update(usersTable).set({ status: parsed.data.blocked ? "blocked" : "active" }).where(eq(usersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(updated));
});

router.patch("/admin/users/:id/balance", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const parsed = AdminUpdateBalanceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const [updated] = await db.update(usersTable).set({ balance: parsed.data.balance.toString() }).where(eq(usersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(updated));
});

router.get("/admin/transfers", requireAuth, requireAdmin, async (req, res) => {
  const { page = "1", limit = "20" } = req.query as Record<string, string>;
  const allTransfers = await db.select().from(transfersTable);
  const p = parseInt(page), l = parseInt(limit);
  const paginated = allTransfers.slice((p - 1) * l, p * l);

  res.json({
    transfers: paginated.map(t => ({
      id: t.id,
      userId: t.userId,
      token: t.token,
      beneficiaryName: t.beneficiaryName,
      amount: Number(t.amount),
      currency: t.currency,
      message: t.message ?? null,
      status: t.status,
      accessType: t.accessType,
      expiresAt: t.expiresAt?.toISOString() ?? null,
      reference: t.reference,
      createdAt: t.createdAt.toISOString(),
      confirmedAt: t.confirmedAt?.toISOString() ?? null,
      linkUrl: `/t/${t.token}`,
    })),
    total: allTransfers.length,
    page: p,
    limit: l,
  });
});

router.get("/admin/kyc", requireAuth, requireAdmin, async (req, res) => {
  const kycs = await db.select().from(kycTable);
  res.json(kycs.map(formatKyc));
});

router.patch("/admin/kyc/:id/review", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const parsed = AdminReviewKycBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const kycs = await db.select().from(kycTable).where(eq(kycTable.id, id)).limit(1);
  if (kycs.length === 0) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db.update(kycTable).set({
    status: parsed.data.status,
    rejectionReason: parsed.data.rejectionReason ?? null,
    reviewedAt: new Date(),
  }).where(eq(kycTable.id, id)).returning();

  await db.update(usersTable).set({ kycStatus: parsed.data.status as any }).where(eq(usersTable.id, kycs[0].userId));

  res.json(formatKyc(updated));
});

router.get("/admin/stats", requireAuth, requireAdmin, async (req, res) => {
  const allUsers = await db.select().from(usersTable);
  const allTransfers = await db.select().from(transfersTable);
  const pendingKyc = await db.select().from(kycTable).where(eq(kycTable.status, "pending"));
  const subAccounts = await db.select().from(subAccountsTable);
  const referrals = await db.select().from(referralsTable);

  const totalVolume = allTransfers.reduce((s, t) => s + Number(t.amount), 0);

  res.json({
    totalUsers: allUsers.length,
    activeUsers: allUsers.filter(u => u.status === "active").length,
    blockedUsers: allUsers.filter(u => u.status === "blocked").length,
    totalTransfers: allTransfers.length,
    totalVolume,
    pendingKyc: pendingKyc.length,
    totalSubAccounts: subAccounts.length,
    totalReferrals: referrals.length,
  });
});

export default router;
