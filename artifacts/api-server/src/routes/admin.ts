import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, transfersTable, kycTable, subAccountsTable, referralsTable, activityTable, beneficiariesTable, supportMessagesTable, scheduledTransfersTable, fundRequestsTable, systemSettingsTable } from "@workspace/db";
import { eq, ilike, or, gte, sql, desc, and, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { AdminBlockUserBody, AdminUpdateBalanceBody, AdminReviewKycBody } from "@workspace/api-zod";
import { formatUser } from "./auth";
import { formatKyc } from "./kyc";
import { sendWelcomeEmail, sendTransferNotificationEmail } from "../lib/email";

function generateClientId(): string {
  return "CLT-" + Math.floor(100000 + Math.random() * 900000);
}
function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "REF-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
function generateIban(): string {
  const digits = Array.from({ length: 20 }, () => Math.floor(Math.random() * 10)).join("");
  return `FR76 ${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 16)} ${digits.slice(16, 20)}`;
}

const router = Router();

router.get("/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const { page = "1", limit = "20", search, status } = req.query as Record<string, string>;
  const p = parseInt(page), l = parseInt(limit);

  const conditions: any[] = [];
  if (search) {
    const s = `%${search}%`;
    conditions.push(or(ilike(usersTable.fullName, s), ilike(usersTable.email, s), ilike(usersTable.clientId, s)));
  }
  if (status) conditions.push(eq(usersTable.status, status as any));

  const where = conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(usersTable).where(where).limit(l).offset((p - 1) * l),
    db.select({ total: count() }).from(usersTable).where(where),
  ]);

  res.json({ users: rows.map(formatUser), total, page: p, limit: l });
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
  const p = parseInt(page), l = parseInt(limit);

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(transfersTable).orderBy(desc(transfersTable.createdAt)).limit(l).offset((p - 1) * l),
    db.select({ total: count() }).from(transfersTable),
  ]);

  res.json({
    transfers: rows.map(t => ({
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
      blockReason: t.blockReason ?? null,
      adminUnlocked: t.adminUnlocked ?? false,
      adminUnlockedAt: t.adminUnlockedAt?.toISOString() ?? null,
    })),
    total,
    page: p,
    limit: l,
  });
});

// DELETE /admin/transfers/:id — supprimer un virement
router.delete("/admin/transfers/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }
  const [transfer] = await db.select().from(transfersTable).where(eq(transfersTable.id, id)).limit(1);
  if (!transfer) { res.status(404).json({ error: "Virement introuvable" }); return; }
  await db.delete(transfersTable).where(eq(transfersTable.id, id));
  res.json({ ok: true });
});

// DELETE /admin/transfers — supprimer tous les virements (ou ceux d'un statut donné)
router.delete("/admin/transfers", requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.query as Record<string, string>;
  const validStatuses = ["pending", "completed", "cancelled", "expired"];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: "Statut invalide" }); return;
  }
  const where = status ? eq(transfersTable.status, status as any) : undefined;
  await db.delete(transfersTable).where(where);
  res.json({ ok: true });
});

// POST /admin/transfers/:id/unlock — admin confirms withdrawal unblocking
router.post("/admin/transfers/:id/unlock", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

  const [transfer] = await db.select().from(transfersTable).where(eq(transfersTable.id, id)).limit(1);
  if (!transfer) { res.status(404).json({ error: "Virement introuvable" }); return; }

  const [updated] = await db.update(transfersTable)
    .set({ adminUnlocked: true, adminUnlockedAt: new Date() })
    .where(eq(transfersTable.id, id))
    .returning();

  res.json({
    id: updated.id,
    adminUnlocked: updated.adminUnlocked,
    adminUnlockedAt: updated.adminUnlockedAt?.toISOString() ?? null,
  });
});

router.get("/admin/kyc", requireAuth, requireAdmin, async (req, res) => {
  const { page = "1", limit = "20", status } = req.query as Record<string, string>;
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));

  const where = status ? eq(kycTable.status, status as any) : undefined;

  const [kycs, [{ total }]] = await Promise.all([
    db.select().from(kycTable).where(where)
      .orderBy(desc(kycTable.submittedAt))
      .limit(l).offset((p - 1) * l),
    db.select({ total: count() }).from(kycTable).where(where),
  ]);

  res.setHeader("Cache-Control", "private, max-age=10");
  res.json({ kycs: kycs.map(formatKyc), total, page: p, limit: l });
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

// ─── In-memory cache for expensive admin queries ────────────────────────────
const _cache = new Map<string, { data: unknown; expiresAt: number }>();
function getCached<T>(key: string): T | null {
  const entry = _cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data as T;
}
function setCached(key: string, data: unknown, ttlMs: number) {
  _cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// GET /admin/charts — time-series data for the last N days (SQL-aggregated)
router.get("/admin/charts", requireAuth, requireAdmin, async (req, res) => {
  const days = Math.min(Number(req.query["days"] ?? 14), 90);
  const cacheKey = `admin_charts_${days}`;
  const cached = getCached<object>(cacheKey);
  if (cached) { res.setHeader("Cache-Control", "private, max-age=60"); res.json(cached); return; }

  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);

  // Aggregated queries — no full table scan
  const [transferRows, userRows, statusRows, currencyRows] = await Promise.all([
    db.select({
      date: sql<string>`date_trunc('day', ${transfersTable.createdAt} AT TIME ZONE 'UTC')::date::text`,
      transfers: sql<number>`count(*)::int`,
      volume: sql<number>`coalesce(sum(${transfersTable.amount}::numeric), 0)::float`,
      confirmedTransfers: sql<number>`count(*) filter (where ${transfersTable.status} = 'completed')::int`,
    })
      .from(transfersTable)
      .where(gte(transfersTable.createdAt, since))
      .groupBy(sql`date_trunc('day', ${transfersTable.createdAt} AT TIME ZONE 'UTC')`)
      .orderBy(sql`date_trunc('day', ${transfersTable.createdAt} AT TIME ZONE 'UTC')`),

    db.select({
      date: sql<string>`date_trunc('day', ${usersTable.createdAt} AT TIME ZONE 'UTC')::date::text`,
      newUsers: sql<number>`count(*)::int`,
    })
      .from(usersTable)
      .where(gte(usersTable.createdAt, since))
      .groupBy(sql`date_trunc('day', ${usersTable.createdAt} AT TIME ZONE 'UTC')`),

    db.select({
      status: transfersTable.status,
      count: sql<number>`count(*)::int`,
    })
      .from(transfersTable)
      .groupBy(transfersTable.status),

    db.select({
      currency: transfersTable.currency,
      volume: sql<number>`coalesce(sum(${transfersTable.amount}::numeric), 0)::float`,
    })
      .from(transfersTable)
      .groupBy(transfersTable.currency),
  ]);

  // Build day-keyed lookup maps
  const tByDay = new Map(transferRows.map(r => [r.date.slice(0, 10), r]));
  const uByDay = new Map(userRows.map(r => [r.date.slice(0, 10), r.newUsers]));

  const dayKeys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }

  const result = {
    days: dayKeys.map((date) => {
      const t = tByDay.get(date);
      return {
        date,
        label: date.slice(5),
        transfers: t?.transfers ?? 0,
        volume: Math.round((t?.volume ?? 0) * 100) / 100,
        confirmedTransfers: t?.confirmedTransfers ?? 0,
        newUsers: uByDay.get(date) ?? 0,
      };
    }),
    statusBreakdown: statusRows.map(r => ({ status: r.status, count: r.count })),
    currencyVolume: currencyRows.map(r => ({ currency: r.currency, volume: Math.round(r.volume * 100) / 100 })),
  };

  setCached(cacheKey, result, 60_000);
  res.setHeader("Cache-Control", "private, max-age=60");
  res.json(result);
});

router.get("/admin/stats", requireAuth, requireAdmin, async (req, res) => {
  const cached = getCached<object>("admin_stats");
  if (cached) { res.setHeader("Cache-Control", "private, max-age=30"); res.json(cached); return; }

  const [userStats, transferStats, [{ pendingKyc }], [{ totalSubAccounts }], [{ totalReferrals }]] = await Promise.all([
    db.select({
      total:   sql<number>`count(*)::int`,
      active:  sql<number>`count(*) filter (where ${usersTable.status} = 'active')::int`,
      blocked: sql<number>`count(*) filter (where ${usersTable.status} = 'blocked')::int`,
    }).from(usersTable),

    db.select({
      total:  sql<number>`count(*)::int`,
      volume: sql<number>`coalesce(sum(${transfersTable.amount}::numeric), 0)::float`,
    }).from(transfersTable),

    db.select({ pendingKyc: sql<number>`count(*)::int` }).from(kycTable).where(eq(kycTable.status, "pending")),
    db.select({ totalSubAccounts: sql<number>`count(*)::int` }).from(subAccountsTable),
    db.select({ totalReferrals: sql<number>`count(*)::int` }).from(referralsTable),
  ]);

  const result = {
    totalUsers: userStats[0].total,
    activeUsers: userStats[0].active,
    blockedUsers: userStats[0].blocked,
    totalTransfers: transferStats[0].total,
    totalVolume: transferStats[0].volume,
    pendingKyc,
    totalSubAccounts,
    totalReferrals,
  };
  setCached("admin_stats", result, 30_000);
  res.setHeader("Cache-Control", "private, max-age=30");
  res.json(result);
});

// POST /admin/users/:id/credit
router.post("/admin/users/:id/credit", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { amount, reason } = req.body;
  if (typeof amount !== "number" || amount <= 0 || typeof reason !== "string" || !reason.trim()) {
    res.status(400).json({ error: "Montant ou motif invalide" }); return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  const newBalance = (Number(user.balance) + amount).toFixed(2);
  const [updated] = await db.update(usersTable).set({ balance: newBalance }).where(eq(usersTable.id, id)).returning();
  await db.insert(activityTable).values({
    userId: id,
    type: "deposit",
    description: `Crédit admin : +${amount} ${user.currency} — ${reason}`,
    amount: amount.toString(),
    currency: user.currency,
  });
  res.json(formatUser(updated));
});

// POST /admin/users/:id/debit
router.post("/admin/users/:id/debit", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { amount, reason } = req.body;
  if (typeof amount !== "number" || amount <= 0 || typeof reason !== "string" || !reason.trim()) {
    res.status(400).json({ error: "Montant ou motif invalide" }); return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  const newBalance = Math.max(0, Number(user.balance) - amount).toFixed(2);
  const [updated] = await db.update(usersTable).set({ balance: newBalance }).where(eq(usersTable.id, id)).returning();
  await db.insert(activityTable).values({
    userId: id,
    type: "withdrawal",
    description: `Débit admin : -${amount} ${user.currency} — ${reason}`,
    amount: amount.toString(),
    currency: user.currency,
  });
  res.json(formatUser(updated));
});

// GET /admin/users/:id/transfers
router.get("/admin/users/:id/transfers", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const transfers = await db.select().from(transfersTable).where(eq(transfersTable.userId, id));
  res.json(transfers.map((t) => ({
    id: t.id,
    token: t.token,
    beneficiaryName: t.beneficiaryName,
    amount: Number(t.amount),
    currency: t.currency,
    message: t.message ?? null,
    status: t.status,
    reference: t.reference,
    createdAt: t.createdAt.toISOString(),
    confirmedAt: t.confirmedAt?.toISOString() ?? null,
  })));
});

// PATCH /admin/users/:id/role — promouvoir ou rétrograder admin
router.patch("/admin/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { role } = req.body;
  if (role !== "admin" && role !== "user") {
    res.status(400).json({ error: "Rôle invalide (admin ou user)" }); return;
  }
  const [updated] = await db.update(usersTable).set({ role } as any).where(eq(usersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  res.json(formatUser(updated));
});

// DELETE /admin/users/:id — supprimer un utilisateur et ses données
router.delete("/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  if (user.role === "admin") { res.status(403).json({ error: "Impossible de supprimer un compte admin" }); return; }
  await db.delete(activityTable).where(eq(activityTable.userId, id));
  await db.delete(fundRequestsTable).where(eq(fundRequestsTable.fromUserId, id));
  await db.delete(scheduledTransfersTable).where(eq(scheduledTransfersTable.userId, id));
  await db.delete(supportMessagesTable).where(eq(supportMessagesTable.userId, id));
  await db.delete(beneficiariesTable).where(eq(beneficiariesTable.userId, id));
  await db.delete(kycTable).where(eq(kycTable.userId, id));
  await db.delete(transfersTable).where(eq(transfersTable.userId, id));
  await db.delete(referralsTable).where(eq(referralsTable.referrerId, id));
  await db.delete(referralsTable).where(eq(referralsTable.referredUserId, id));
  await db.delete(subAccountsTable).where(eq(subAccountsTable.parentUserId, id));
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

// POST /admin/transfers/create — admin creates a transfer link
router.post("/admin/transfers/create", requireAuth, requireAdmin, async (req, res) => {
  const { userId, beneficiaryName, amount, currency, message } = req.body;
  if (!beneficiaryName || !amount || !currency) {
    res.status(400).json({ error: "Champs requis manquants" }); return;
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: "Montant invalide" }); return;
  }

  function safeStr(val: unknown): string | null {
    return typeof val === "string" && val.trim().length > 0 ? val.trim() : null;
  }

  const _refChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const token = Array.from({ length: 12 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
  const reference = "BMDW" + Array.from({ length: 12 }, () => _refChars[Math.floor(Math.random() * _refChars.length)]).join("");

  const senderFirstName = safeStr(req.body.senderFirstName);
  const senderLastName  = safeStr(req.body.senderLastName);
  const senderCountry   = safeStr(req.body.senderCountry);
  const senderCity      = safeStr(req.body.senderCity);
  const receiverFirstName = safeStr(req.body.receiverFirstName);
  const receiverLastName  = safeStr(req.body.receiverLastName);
  const receiverEmail     = safeStr(req.body.receiverEmail);
  const receiverCountry   = safeStr(req.body.receiverCountry);
  const receiverCity      = safeStr(req.body.receiverCity);
  const displayCurrency   = safeStr(req.body.displayCurrency) ?? "EUR";
  const blockReason       = safeStr(req.body.blockReason);
  const whatsappNumber    = safeStr(req.body.whatsappNumber);
  const validTypes = ["virement", "dépôt", "retrait", "facture"];
  const transactionType = typeof req.body.transactionType === "string" && validTypes.includes(req.body.transactionType)
    ? req.body.transactionType : "virement";
  const receiverAccountNumber = safeStr(req.body.receiverAccountNumber);
  const receiverBankId = safeStr(req.body.receiverBankId);
  const receiverBankLabel = safeStr(req.body.receiverBankLabel);
  let paymentMethods: string | null = null;
  if (Array.isArray(req.body.paymentMethods) && req.body.paymentMethods.length > 0) {
    paymentMethods = JSON.stringify(req.body.paymentMethods.filter((m: unknown) => typeof m === "string"));
  }
  let paymentMethodLabels: string | null = null;
  if (Array.isArray(req.body.paymentMethodLabels) && req.body.paymentMethodLabels.length > 0) {
    paymentMethodLabels = JSON.stringify(req.body.paymentMethodLabels.filter((m: unknown) => typeof m === "string"));
  }

  try {
    const [transfer] = await db.insert(transfersTable).values({
      userId: userId ? Number(userId) : null,
      token,
      beneficiaryName,
      amount: numAmount.toFixed(2),
      currency: "EUR",
      message: message ?? null,
      transactionType,
      status: "pending",
      reference,
      senderFirstName, senderLastName, senderCountry, senderCity,
      receiverFirstName, receiverLastName, receiverEmail, receiverCountry, receiverCity,
      receiverAccountNumber,
      receiverBankId,
      receiverBankLabel,
      displayCurrency,
      paymentMethods,
      paymentMethodLabels,
      blockReason,
      whatsappNumber,
    }).returning();

    if (userId) {
      await db.insert(activityTable).values({
        userId: Number(userId),
        type: "transfer_sent",
        description: `Virement admin vers ${beneficiaryName} : ${numAmount} EUR`,
        amount: numAmount.toFixed(2),
        currency: "EUR",
        referenceId: transfer.id,
      });
    }

    const appUrl = process.env.APP_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN ?? "localhost:5000"}`;
    const fullLinkUrl = `${appUrl}/t/${transfer.token}`;

    // Send transfer notification email to receiver (non-blocking)
    if (receiverEmail) {
      const receiverFullName = [receiverFirstName, receiverLastName].filter(Boolean).join(" ") || beneficiaryName;
      const senderFullName = [senderFirstName, senderLastName].filter(Boolean).join(" ") || "Banque Mondiale";
      sendTransferNotificationEmail({
        to: receiverEmail,
        receiverName: receiverFullName,
        senderName: senderFullName,
        amount: numAmount,
        currency: "EUR",
        displayCurrency: displayCurrency ?? "EUR",
        reference: transfer.reference,
        linkUrl: fullLinkUrl,
        message: message ?? null,
      }).then((r) => console.log("[email] transfer-notification sent:", JSON.stringify(r)))
        .catch((err) => console.error("[email] transfer-notification ERROR:", err));
    }

    res.json({
      id: transfer.id,
      token: transfer.token,
      beneficiaryName: transfer.beneficiaryName,
      amount: Number(transfer.amount),
      currency: transfer.currency,
      displayCurrency: transfer.displayCurrency,
      status: transfer.status,
      reference: transfer.reference,
      createdAt: transfer.createdAt.toISOString(),
      linkUrl: `/t/${transfer.token}`,
    });
  } catch (err: any) {
    console.error("[admin/transfers/create]", err);
    res.status(500).json({ error: err?.message ?? "Erreur serveur lors de la création du virement" });
  }
});

// POST /admin/users/create — admin crée un compte utilisateur
router.post("/admin/users/create", requireAuth, requireAdmin, async (req, res) => {
  const { fullName, email, phone, country, password, initialBalance, currency } = req.body;
  if (!fullName || !email || !phone || !country || !password) {
    res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis" }); return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) { res.status(400).json({ error: "Cet email est déjà utilisé" }); return; }

  const passwordHash = await bcrypt.hash(password, 10);
  const clientId = generateClientId();
  const refCode = generateReferralCode();
  const iban = generateIban();
  const bal = initialBalance && Number(initialBalance) > 0 ? Number(initialBalance).toFixed(2) : "0.00";

  const [user] = await db.insert(usersTable).values({
    clientId, fullName, email, phone, country, passwordHash,
    referralCode: refCode, iban, balance: bal,
    currency: currency || "EUR", status: "active", role: "user", kycStatus: "none",
  }).returning();

  await db.insert(activityTable).values({
    userId: user.id, type: "login", description: "Compte créé par le service bancaire Banque mondiale",
  });

  // Send welcome email (non-blocking)
  sendWelcomeEmail({
    to: user.email,
    fullName: user.fullName,
    email: user.email,
    clientId: user.clientId,
    iban: user.iban ?? "",
    currency: user.currency,
  }).then((r) => console.log("[email] admin-welcome sent:", JSON.stringify(r)))
    .catch((err) => console.error("[email] admin-welcome ERROR:", err));

  res.status(201).json(formatUser(user));
});

// GET /system/withdrawal-block — public: état du blocage des retraits
router.get("/system/withdrawal-block", async (_req, res) => {
  const [setting] = await db.select().from(systemSettingsTable)
    .where(eq(systemSettingsTable.key, "withdrawal_block")).limit(1);
  if (!setting) { res.json({ blocked: false, reason: null, whatsapp: null }); return; }
  try {
    const parsed = JSON.parse(setting.value);
    res.json(parsed);
  } catch {
    res.json({ blocked: false, reason: null, whatsapp: null });
  }
});

// GET /admin/settings/withdrawal-block — admin: lire la config
router.get("/admin/settings/withdrawal-block", requireAuth, requireAdmin, async (_req, res) => {
  const [setting] = await db.select().from(systemSettingsTable)
    .where(eq(systemSettingsTable.key, "withdrawal_block")).limit(1);
  if (!setting) { res.json({ blocked: false, reason: "", whatsapp: "" }); return; }
  try { res.json(JSON.parse(setting.value)); }
  catch { res.json({ blocked: false, reason: "", whatsapp: "" }); }
});

// POST /admin/settings/withdrawal-block — admin: modifier la config
router.post("/admin/settings/withdrawal-block", requireAuth, requireAdmin, async (req, res) => {
  const { blocked, reason, whatsapp } = req.body;
  if (typeof blocked !== "boolean") { res.status(400).json({ error: "Champ 'blocked' requis (boolean)" }); return; }
  const value = JSON.stringify({ blocked, reason: reason ?? "", whatsapp: whatsapp ?? "" });
  const existing = await db.select().from(systemSettingsTable)
    .where(eq(systemSettingsTable.key, "withdrawal_block")).limit(1);
  if (existing.length > 0) {
    await db.update(systemSettingsTable).set({ value, updatedAt: new Date() })
      .where(eq(systemSettingsTable.key, "withdrawal_block"));
  } else {
    await db.insert(systemSettingsTable).values({ key: "withdrawal_block", value });
  }
  res.json({ blocked, reason: reason ?? "", whatsapp: whatsapp ?? "" });
});

// POST /admin/test-email — envoie un email de test pour diagnostiquer Resend
router.post("/admin/test-email", requireAuth, requireAdmin, async (req, res) => {
  const { to } = req.body;
  if (!to) { res.status(400).json({ error: "Champ 'to' requis" }); return; }
  console.log("[email] test: RESEND_API_KEY present?", !!process.env.RESEND_API_KEY);
  console.log("[email] test: EMAIL_FROM =", process.env.EMAIL_FROM);
  try {
    const result = await sendWelcomeEmail({
      to,
      fullName: "Test Utilisateur",
      email: to,
      clientId: "CLT-TEST",
      iban: "FR76 0000 0000 0000 0000 0000 000",
      currency: "EUR",
    });
    console.log("[email] test result:", JSON.stringify(result));
    res.json({ ok: true, result });
  } catch (err: any) {
    console.error("[email] test ERROR:", err);
    res.status(500).json({ ok: false, error: err?.message, detail: err });
  }
});

export default router;
