import { Router } from "express";
import { db, scheduledTransfersTable, usersTable, activityTable } from "@workspace/db";
import { eq, and, lte } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function parseScheduledBody(body: any): { beneficiaryName: string; amount: number; currency: string; message?: string; scheduledAt: string } | null {
  if (!body) return null;
  const beneficiaryName = typeof body.beneficiaryName === "string" ? body.beneficiaryName.trim() : "";
  const amount = typeof body.amount === "number" ? body.amount : parseFloat(body.amount);
  const currency = typeof body.currency === "string" ? body.currency.trim() : "";
  const scheduledAt = typeof body.scheduledAt === "string" ? body.scheduledAt : "";
  if (!beneficiaryName || isNaN(amount) || amount <= 0 || !currency || !scheduledAt) return null;
  return { beneficiaryName, amount, currency, scheduledAt, message: typeof body.message === "string" ? body.message : undefined };
}

router.get("/scheduled-transfers", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const rows = await db
    .select()
    .from(scheduledTransfersTable)
    .where(eq(scheduledTransfersTable.userId, userId));
  res.json(rows.map((r) => ({ ...r, amount: Number(r.amount), scheduledAt: r.scheduledAt.toISOString(), createdAt: r.createdAt.toISOString() })));
});

router.post("/scheduled-transfers", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const parsed = parseScheduledBody(req.body);
  if (!parsed) { res.status(400).json({ error: "Données invalides" }); return; }

  const scheduledAt = new Date(parsed.scheduledAt);
  if (scheduledAt <= new Date()) { res.status(400).json({ error: "La date doit être dans le futur" }); return; }

  const [users] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  if (Number(users.balance) < parsed.amount) {
    res.status(400).json({ error: "Solde insuffisant" }); return;
  }

  const [row] = await db
    .insert(scheduledTransfersTable)
    .values({
      userId,
      beneficiaryName: parsed.beneficiaryName,
      amount: parsed.amount.toString(),
      currency: parsed.currency,
      message: parsed.message ?? null,
      scheduledAt,
    })
    .returning();

  res.status(201).json({ ...row, amount: Number(row.amount), scheduledAt: row.scheduledAt.toISOString(), createdAt: row.createdAt.toISOString() });
});

router.delete("/scheduled-transfers/:id", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db
    .select()
    .from(scheduledTransfersTable)
    .where(and(eq(scheduledTransfersTable.id, id), eq(scheduledTransfersTable.userId, userId)))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Virement introuvable" }); return; }
  if (existing.status !== "pending") { res.status(400).json({ error: "Impossible d'annuler un virement déjà traité" }); return; }

  await db
    .update(scheduledTransfersTable)
    .set({ status: "cancelled" })
    .where(eq(scheduledTransfersTable.id, id));

  res.json({ success: true });
});

// Internal executor — called by a cron or manually; processes due scheduled transfers
router.post("/scheduled-transfers/execute", requireAuth, async (req, res) => {
  const now = new Date();
  const due = await db
    .select()
    .from(scheduledTransfersTable)
    .where(and(eq(scheduledTransfersTable.status, "pending"), lte(scheduledTransfersTable.scheduledAt, now)));

  let executed = 0;
  for (const st of due) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, st.userId)).limit(1);
    if (!user || Number(user.balance) < Number(st.amount)) {
      await db.update(scheduledTransfersTable).set({ status: "failed" }).where(eq(scheduledTransfersTable.id, st.id));
      continue;
    }
    await db.update(usersTable).set({ balance: (Number(user.balance) - Number(st.amount)).toString() }).where(eq(usersTable.id, user.id));
    await db.update(scheduledTransfersTable).set({ status: "executed" }).where(eq(scheduledTransfersTable.id, st.id));
    await db.insert(activityTable).values({
      userId: st.userId,
      type: "transfer_sent",
      description: `Virement planifié exécuté vers ${st.beneficiaryName}`,
      amount: st.amount,
      currency: st.currency,
    });
    executed++;
  }

  res.json({ processed: due.length, executed });
});

export default router;
