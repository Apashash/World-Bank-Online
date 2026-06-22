import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middlewares/auth";
import { formatUser } from "./auth";

const router = Router();

router.get("/users/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (users.length === 0) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(users[0]));
});

router.patch("/users/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { userId } = (req as any).user;
  if (id !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const { fullName, phone, country, email } = req.body;
  const updates: Record<string, string> = {};
  if (fullName) updates.fullName = fullName;
  if (phone) updates.phone = phone;
  if (country) updates.country = country;

  if (email) {
    const existing = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(and(eq(usersTable.email, email), ne(usersTable.id, id)))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Cet email est déjà utilisé par un autre compte." });
      return;
    }
    updates.email = email;
  }

  if (Object.keys(updates).length === 0) {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    res.json(formatUser(users[0]));
    return;
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  res.json(formatUser(updated));
});

router.post("/users/:id/change-password", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { userId } = (req as any).user;
  if (id !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Mot de passe actuel et nouveau mot de passe requis." });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (users.length === 0) { res.status(404).json({ error: "Utilisateur introuvable." }); return; }

  const valid = await bcrypt.compare(currentPassword, users[0].passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Mot de passe actuel incorrect." });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, id));
  res.json({ success: true });
});

export default router;
