import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, subAccountsTable, activityTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateSubAccountBody, UpdateSubAccountBody } from "@workspace/api-zod";

const router = Router();

function formatSubAccount(s: typeof subAccountsTable.$inferSelect) {
  return {
    id: s.id,
    parentUserId: s.parentUserId,
    fullName: s.fullName,
    email: s.email,
    permissions: s.permissions ?? [],
    status: s.status,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/sub-accounts", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const accounts = await db.select().from(subAccountsTable).where(eq(subAccountsTable.parentUserId, userId));
  res.json(accounts.map(formatSubAccount));
});

router.post("/sub-accounts", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const parsed = CreateSubAccountBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const { fullName, email, password, permissions } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  const [account] = await db.insert(subAccountsTable).values({
    parentUserId: userId,
    fullName,
    email,
    passwordHash,
    permissions: permissions ?? [],
    status: "active",
  }).returning();

  await db.insert(activityTable).values({
    userId,
    type: "sub_account_created",
    description: `Sous-compte créé pour ${fullName}`,
  });

  res.status(201).json(formatSubAccount(account));
});

router.get("/sub-accounts/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { userId } = (req as any).user;
  const accounts = await db.select().from(subAccountsTable).where(and(eq(subAccountsTable.id, id), eq(subAccountsTable.parentUserId, userId))).limit(1);
  if (accounts.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatSubAccount(accounts[0]));
});

router.patch("/sub-accounts/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { userId } = (req as any).user;
  const parsed = UpdateSubAccountBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const existing = await db.select().from(subAccountsTable).where(and(eq(subAccountsTable.id, id), eq(subAccountsTable.parentUserId, userId))).limit(1);
  if (existing.length === 0) { res.status(404).json({ error: "Not found" }); return; }

  const updates: Record<string, any> = {};
  if (parsed.data.permissions !== undefined) updates.permissions = parsed.data.permissions;
  if (parsed.data.status) updates.status = parsed.data.status;

  const [updated] = await db.update(subAccountsTable).set(updates).where(eq(subAccountsTable.id, id)).returning();
  res.json(formatSubAccount(updated));
});

router.delete("/sub-accounts/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { userId } = (req as any).user;
  const existing = await db.select().from(subAccountsTable).where(and(eq(subAccountsTable.id, id), eq(subAccountsTable.parentUserId, userId))).limit(1);
  if (existing.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  await db.delete(subAccountsTable).where(eq(subAccountsTable.id, id));
  res.json({ message: "Sub-account deleted" });
});

export default router;
