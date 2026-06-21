import { Router } from "express";
import { db, usersTable, activityTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function getUser(userId: number) {
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  return rows[0] ?? null;
}

router.post("/wallet/depot", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const { amount, description } = req.body;

  const num = Number(amount);
  if (!num || num <= 0 || !isFinite(num)) {
    res.status(400).json({ error: "Montant invalide" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ balance: sql`${usersTable.balance} + ${num.toFixed(2)}` })
    .where(eq(usersTable.id, userId))
    .returning({ balance: usersTable.balance });

  await db.insert(activityTable).values({
    userId,
    type: "deposit",
    description: description ? `Dépôt : ${description}` : `Dépôt de ${num.toFixed(2)} EUR`,
    amount: num.toFixed(2),
    currency: "EUR",
  });

  res.json({ balance: Number(updated.balance), deposited: num });
});

router.post("/wallet/retrait", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const { amount, method } = req.body;

  const num = Number(amount);
  if (!num || num <= 0 || !isFinite(num)) {
    res.status(400).json({ error: "Montant invalide" });
    return;
  }

  const user = await getUser(userId);
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }

  const currentBalance = Number(user.balance);
  if (currentBalance < num) {
    res.status(400).json({ error: "Solde insuffisant", balance: currentBalance });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ balance: sql`${usersTable.balance} - ${num.toFixed(2)}` })
    .where(eq(usersTable.id, userId))
    .returning({ balance: usersTable.balance });

  const methodLabel = method === "atm" ? "DAB" : "agence";
  await db.insert(activityTable).values({
    userId,
    type: "withdrawal",
    description: `Retrait ${methodLabel} de ${num.toFixed(2)} EUR`,
    amount: num.toFixed(2),
    currency: "EUR",
  });

  res.json({ balance: Number(updated.balance), withdrawn: num });
});

router.post("/wallet/payer-factures", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const { amount, biller, reference } = req.body;

  const num = Number(amount);
  if (!num || num <= 0 || !isFinite(num)) {
    res.status(400).json({ error: "Montant invalide" });
    return;
  }
  if (!biller || !reference) {
    res.status(400).json({ error: "Fournisseur et référence requis" });
    return;
  }

  const user = await getUser(userId);
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }

  const currentBalance = Number(user.balance);
  if (currentBalance < num) {
    res.status(400).json({ error: "Solde insuffisant", balance: currentBalance });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ balance: sql`${usersTable.balance} - ${num.toFixed(2)}` })
    .where(eq(usersTable.id, userId))
    .returning({ balance: usersTable.balance });

  await db.insert(activityTable).values({
    userId,
    type: "bill_payment",
    description: `Facture ${biller} — réf. ${reference}`,
    amount: num.toFixed(2),
    currency: "EUR",
  });

  res.json({ balance: Number(updated.balance), paid: num });
});

export default router;
