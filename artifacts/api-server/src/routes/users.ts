import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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

  const { fullName, phone, country } = req.body;
  const updates: Record<string, string> = {};
  if (fullName) updates.fullName = fullName;
  if (phone) updates.phone = phone;
  if (country) updates.country = country;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  res.json(formatUser(updated));
});

export default router;
