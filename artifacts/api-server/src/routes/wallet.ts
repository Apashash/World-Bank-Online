import { Router } from "express";
import { db, usersTable, activityTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
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

// POST /wallet/bm-transfer — transfert entre comptes Banque Mondiale
router.post("/wallet/bm-transfer", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const { email, iban, clientId, amount } = req.body;

  const num = Number(amount);
  if (!num || num <= 0 || !isFinite(num)) {
    res.status(400).json({ error: "Montant invalide" }); return;
  }
  if (!email || !iban || !clientId) {
    res.status(400).json({ error: "Email, IBAN et Client ID requis" }); return;
  }

  // Find recipient by all 3 identifiers
  const normalizedIban = String(iban).replace(/\s/g, "").toUpperCase();
  const [recipient] = await db.select().from(usersTable)
    .where(and(
      eq(usersTable.email, String(email).trim().toLowerCase()),
      eq(usersTable.clientId, String(clientId).trim()),
    ))
    .limit(1);

  if (!recipient) {
    res.status(404).json({ error: "Aucun compte Banque Mondiale trouvé avec ces informations. Vérifiez l'email et le Client ID." }); return;
  }

  // Verify IBAN matches (if recipient has one set)
  if (recipient.iban && recipient.iban.replace(/\s/g, "").toUpperCase() !== normalizedIban) {
    res.status(404).json({ error: "L'IBAN fourni ne correspond pas au compte trouvé." }); return;
  }

  if (recipient.id === userId) {
    res.status(400).json({ error: "Vous ne pouvez pas vous transférer à vous-même." }); return;
  }

  // Check sender balance
  const sender = await getUser(userId);
  if (!sender) { res.status(404).json({ error: "Expéditeur introuvable" }); return; }

  const senderBalance = Number(sender.balance);
  if (senderBalance < num) {
    res.status(400).json({ error: `Solde insuffisant. Votre solde : ${senderBalance.toFixed(2)} EUR` }); return;
  }

  // Debit sender
  const [updatedSender] = await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} - ${num.toFixed(2)}` })
    .where(eq(usersTable.id, userId))
    .returning({ balance: usersTable.balance });

  // Credit recipient
  const [updatedRecipient] = await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} + ${num.toFixed(2)}` })
    .where(eq(usersTable.id, recipient.id))
    .returning({ balance: usersTable.balance });

  // Activity: sender
  await db.insert(activityTable).values({
    userId,
    type: "transfer_sent",
    description: `Virement BM vers ${recipient.fullName} (${recipient.clientId}) — ${num.toFixed(2)} EUR`,
    amount: num.toFixed(2),
    currency: "EUR",
  });

  // Activity: recipient
  await db.insert(activityTable).values({
    userId: recipient.id,
    type: "transfer_received",
    description: `Virement reçu de ${sender.fullName} (${sender.clientId}) — ${num.toFixed(2)} EUR`,
    amount: num.toFixed(2),
    currency: "EUR",
  });

  res.json({
    ok: true,
    recipientName: recipient.fullName,
    recipientClientId: recipient.clientId,
    amount: num,
    newBalance: Number(updatedSender.balance),
  });
});

export default router;
