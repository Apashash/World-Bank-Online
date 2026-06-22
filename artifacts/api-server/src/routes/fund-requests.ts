import { Router } from "express";
import { db, fundRequestsTable, usersTable, activityTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { randomBytes } from "crypto";

const router = Router();

function parseFundRequestBody(body: any): { toEmail: string; amount: number; currency: string; message?: string } | null {
  if (!body) return null;
  const toEmail = typeof body.toEmail === "string" ? body.toEmail.trim() : "";
  const amount = typeof body.amount === "number" ? body.amount : parseFloat(body.amount);
  const currency = typeof body.currency === "string" ? body.currency.trim() : "EUR";
  if (!toEmail || !toEmail.includes("@") || isNaN(amount) || amount <= 0) return null;
  return { toEmail, amount, currency, message: typeof body.message === "string" ? body.message : undefined };
}

router.get("/fund-requests", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const rows = await db.select().from(fundRequestsTable).where(eq(fundRequestsTable.fromUserId, userId));
  res.json(rows.map((r) => ({
    ...r,
    amount: Number(r.amount),
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt?.toISOString() ?? null,
  })));
});

router.post("/fund-requests", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const parsed = parseFundRequestBody(req.body);
  if (!parsed) { res.status(400).json({ error: "Données invalides" }); return; }

  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const [row] = await db
    .insert(fundRequestsTable)
    .values({
      fromUserId: userId,
      toEmail: parsed.toEmail,
      amount: parsed.amount.toString(),
      currency: parsed.currency,
      message: parsed.message ?? null,
      token,
      expiresAt,
    })
    .returning();

  await db.insert(activityTable).values({
    userId,
    type: "transfer_sent",
    description: `Demande de fonds envoyée à ${parsed.toEmail}`,
    amount: parsed.amount.toString(),
    currency: parsed.currency,
  });

  res.status(201).json({
    ...row,
    amount: Number(row.amount),
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    link: `/fund-request/${token}`,
  });
});

// Public: view a fund request by token
router.get("/fund-requests/link/:token", async (req, res) => {
  const [row] = await db
    .select()
    .from(fundRequestsTable)
    .where(eq(fundRequestsTable.token, req.params["token"] as string))
    .limit(1);

  if (!row) { res.status(404).json({ error: "Demande introuvable" }); return; }

  const [requester] = await db.select({ fullName: usersTable.fullName, email: usersTable.email })
    .from(usersTable).where(eq(usersTable.id, row.fromUserId)).limit(1);

  res.json({
    id: row.id,
    requesterName: requester?.fullName ?? "Inconnu",
    requesterEmail: requester?.email ?? "",
    amount: Number(row.amount),
    currency: row.currency,
    message: row.message,
    status: row.status,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  });
});

router.delete("/fund-requests/:id", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db
    .update(fundRequestsTable)
    .set({ status: "cancelled" })
    .where(and(eq(fundRequestsTable.id, id), eq(fundRequestsTable.fromUserId, userId)));

  res.json({ success: true });
});

export default router;
