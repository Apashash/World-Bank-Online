import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, referralsTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../middlewares/auth";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { sendWelcomeEmail } from "../lib/email";

const router = Router();

function generateClientId(): string {
  return "CLT-" + Math.floor(100000 + Math.random() * 900000);
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "REF-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateIban(): string {
  const digits = Array.from({ length: 20 }, () => Math.floor(Math.random() * 10)).join("");
  return `FR76 ${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 16)} ${digits.slice(16, 20)}`;
}

export function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    clientId: user.clientId,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    country: user.country,
    balance: Number(user.balance),
    currency: user.currency,
    status: user.status,
    role: user.role,
    referralCode: user.referralCode,
    kycStatus: user.kycStatus,
    iban: user.iban ?? null,
    onboardingCompleted: user.onboardingCompleted,
    balanceAlertThreshold: user.balanceAlertThreshold ? Number(user.balanceAlertThreshold) : null,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { fullName, email, phone, country, password, referralCode } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let clientId = generateClientId();
  let refCode = generateReferralCode();
  const iban = generateIban();

  const [user] = await db.insert(usersTable).values({
    clientId,
    fullName,
    email,
    phone,
    country,
    passwordHash,
    referralCode: refCode,
    iban,
    balance: "0.00",
    currency: "EUR",
    status: "active",
    role: "user",
    kycStatus: "none",
  }).returning();

  if (referralCode) {
    const referrer = await db.select().from(usersTable).where(eq(usersTable.referralCode, referralCode)).limit(1);
    if (referrer.length > 0) {
      await db.insert(referralsTable).values({
        referrerId: referrer[0].id,
        referredUserId: user.id,
        status: "confirmed",
        reward: "25.00",
      });
    }
  }

  await db.insert(activityTable).values({
    userId: user.id,
    type: "login",
    description: "Compte créé avec succès",
  });

  // Send welcome email (non-blocking)
  sendWelcomeEmail({
    to: user.email,
    fullName: user.fullName,
    email: user.email,
    clientId: user.clientId,
    iban: user.iban ?? "",
    currency: user.currency,
  }).then((r) => console.log("[email] welcome sent:", JSON.stringify(r)))
    .catch((err) => console.error("[email] welcome ERROR:", err));

  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({ user: formatUser(user), token });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", code: "VALIDATION_ERROR" });
    return;
  }
  const { email, password } = parsed.data;

  const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (users.length === 0) {
    res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
    return;
  }
  const user = users[0];
  if (user.status === "blocked") {
    res.status(403).json({ error: "Account blocked", code: "ACCOUNT_BLOCKED" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
    return;
  }

  await db.insert(activityTable).values({
    userId: user.id,
    type: "login",
    description: "Connexion réussie",
  });

  const token = signToken({ userId: user.id, role: user.role });
  res.json({ user: formatUser(user), token });
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const { userId, role: jwtRole } = (req as any).user;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (users.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const user = users[0];
  // If DB role changed since JWT was issued, issue a fresh token transparently
  if (user.role !== jwtRole) {
    const freshToken = signToken({ userId: user.id, role: user.role });
    res.setHeader("X-Refresh-Token", freshToken);
  }
  res.json(formatUser(user));
});

export default router;
