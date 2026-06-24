import { Router } from "express";
import { db, transfersTable, activityTable, usersTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateTransferBody, UpdateTransferBody } from "@workspace/api-zod";

const router = Router();

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

function generateReference(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 25; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return "BMDW" + suffix;
}

function formatTransfer(t: typeof transfersTable.$inferSelect) {
  return {
    id: t.id,
    userId: t.userId,
    token: t.token,
    beneficiaryName: t.beneficiaryName,
    amount: Number(t.amount),
    currency: t.currency,
    message: t.message ?? null,
    category: t.category ?? null,
    transactionType: t.transactionType ?? "virement",
    status: t.status,
    accessType: t.accessType,
    expiresAt: t.expiresAt?.toISOString() ?? null,
    reference: t.reference,
    createdAt: t.createdAt.toISOString(),
    confirmedAt: t.confirmedAt?.toISOString() ?? null,
    linkUrl: `/t/${t.token}`,
  };
}

router.get("/transfers", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const { status, page = "1", limit = "20" } = req.query as Record<string, string>;

  const conditions = [eq(transfersTable.userId, userId)];
  if (status) conditions.push(eq(transfersTable.status, status as any));

  const allTransfers = await db.select().from(transfersTable)
    .where(and(...conditions))
    .orderBy(desc(transfersTable.createdAt));

  const p = parseInt(page), l = parseInt(limit);
  const paginated = allTransfers.slice((p - 1) * l, p * l);
  res.json({ transfers: paginated.map(formatTransfer), total: allTransfers.length, page: p, limit: l });
});

router.post("/transfers", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const parsed = CreateTransferBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const { beneficiaryName, amount, currency, message, accessType, expiresAt } = parsed.data;
  const category = typeof req.body.category === "string" ? req.body.category : null;
  const validTypes = ["virement", "dépôt", "retrait", "facture"];
  const transactionType = typeof req.body.transactionType === "string" && validTypes.includes(req.body.transactionType)
    ? req.body.transactionType
    : "virement";

  // Check balance before creating transfer
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (users.length === 0) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  const currentBalance = Number(users[0].balance);
  if (currentBalance < amount) {
    res.status(400).json({ error: "Solde insuffisant", balance: currentBalance });
    return;
  }

  // Deduct balance
  await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} - ${amount.toFixed(2)}` })
    .where(eq(usersTable.id, userId));

  const [transfer] = await db.insert(transfersTable).values({
    userId,
    token: generateToken(),
    beneficiaryName,
    amount: amount.toString(),
    currency: currency || "EUR",
    message: message ?? null,
    category: category,
    transactionType: transactionType,
    status: "pending",
    accessType: accessType || "public",
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    reference: generateReference(),
  }).returning();

  await db.insert(activityTable).values({
    userId,
    type: "transfer_sent",
    description: `Virement créé pour ${beneficiaryName}`,
    amount: amount.toString(),
    currency: currency || "EUR",
    referenceId: transfer.id,
  });

  res.status(201).json(formatTransfer(transfer));
});

router.get("/transfers/link/:token", async (req, res) => {
  const token = req.params["token"] as string;
  const transfers = await db.select().from(transfersTable).where(eq(transfersTable.token, token)).limit(1);
  if (transfers.length === 0) { res.status(404).json({ error: "Transfer not found" }); return; }

  const transfer = transfers[0];

  const users = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, transfer.userId)).limit(1);
  const senderName = users[0]?.fullName ?? null;

  res.json({ ...formatTransfer(transfer), senderName });
});

router.post("/transfers/link/:token/confirm", async (req, res) => {
  const token = req.params["token"] as string;
  const transfers = await db.select().from(transfersTable).where(eq(transfersTable.token, token)).limit(1);
  if (transfers.length === 0) { res.status(404).json({ error: "Transfer not found" }); return; }

  const transfer = transfers[0];
  if (transfer.status !== "pending") {
    res.status(400).json({ error: "Transfer is not pending" });
    return;
  }

  const [updated] = await db.update(transfersTable)
    .set({ status: "completed", confirmedAt: new Date() })
    .where(eq(transfersTable.token, token))
    .returning();

  await db.insert(activityTable).values({
    userId: transfer.userId,
    type: "transfer_confirmed",
    description: `Virement confirmé par ${transfer.beneficiaryName}`,
    amount: transfer.amount,
    currency: transfer.currency,
    referenceId: transfer.id,
  });

  res.json(formatTransfer(updated));
});

router.get("/transfers/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { userId, role } = (req as any).user;
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const transfers = await db.select().from(transfersTable).where(eq(transfersTable.id, id)).limit(1);
  if (transfers.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  if (transfers[0].userId !== userId && role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  res.json(formatTransfer(transfers[0]));
});

router.patch("/transfers/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { userId } = (req as any).user;
  const parsed = UpdateTransferBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const existing = await db.select().from(transfersTable).where(and(eq(transfersTable.id, id), eq(transfersTable.userId, userId))).limit(1);
  if (existing.length === 0) { res.status(404).json({ error: "Not found" }); return; }

  const transfer = existing[0];
  const updates: Record<string, any> = {};
  if (parsed.data.status) updates.status = parsed.data.status;
  if (parsed.data.message !== undefined) updates.message = parsed.data.message;

  // Refund balance if cancelling a pending transfer
  const isCancelling = parsed.data.status === "cancelled" && transfer.status === "pending";
  if (isCancelling) {
    await db.update(usersTable)
      .set({ balance: sql`${usersTable.balance} + ${transfer.amount}` })
      .where(eq(usersTable.id, userId));
    await db.insert(activityTable).values({
      userId,
      type: "transfer_sent",
      description: `Remboursement annulation virement pour ${transfer.beneficiaryName}`,
      amount: transfer.amount,
      currency: transfer.currency,
      referenceId: transfer.id,
    });
  }

  const [updated] = await db.update(transfersTable).set(updates).where(eq(transfersTable.id, id)).returning();
  res.json(formatTransfer(updated));
});

router.delete("/transfers/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { userId } = (req as any).user;

  const existing = await db.select().from(transfersTable).where(and(eq(transfersTable.id, id), eq(transfersTable.userId, userId))).limit(1);
  if (existing.length === 0) { res.status(404).json({ error: "Not found" }); return; }

  const transfer = existing[0];

  // Refund balance if deleting a pending transfer
  if (transfer.status === "pending") {
    await db.update(usersTable)
      .set({ balance: sql`${usersTable.balance} + ${transfer.amount}` })
      .where(eq(usersTable.id, userId));
    await db.insert(activityTable).values({
      userId,
      type: "transfer_sent",
      description: `Remboursement suppression virement pour ${transfer.beneficiaryName}`,
      amount: transfer.amount,
      currency: transfer.currency,
      referenceId: transfer.id,
    });
  }

  await db.delete(transfersTable).where(eq(transfersTable.id, id));
  res.json({ message: "Transfer deleted" });
});

router.post("/transfers/:id/confirm", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const transfers = await db.select().from(transfersTable).where(eq(transfersTable.id, id)).limit(1);
  if (transfers.length === 0) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db.update(transfersTable).set({ status: "completed", confirmedAt: new Date() }).where(eq(transfersTable.id, id)).returning();

  await db.insert(activityTable).values({
    userId: transfers[0].userId,
    type: "transfer_confirmed",
    description: `Virement confirmé par ${transfers[0].beneficiaryName}`,
    amount: transfers[0].amount,
    currency: transfers[0].currency,
    referenceId: transfers[0].id,
  });

  res.json(formatTransfer(updated));
});

export default router;
