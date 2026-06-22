import { Router } from "express";
import { db, beneficiariesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function parseBeneficiaryBody(body: any) {
  if (!body || typeof body.name !== "string" || !body.name.trim()) return null;
  return {
    name: body.name.trim(),
    iban: typeof body.iban === "string" ? body.iban : undefined,
    email: typeof body.email === "string" ? body.email : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
    note: typeof body.note === "string" ? body.note : undefined,
  };
}

router.get("/beneficiaries", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const rows = await db.select().from(beneficiariesTable).where(eq(beneficiariesTable.userId, userId));
  res.json(rows);
});

router.post("/beneficiaries", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const data = parseBeneficiaryBody(req.body);
  if (!data) { res.status(400).json({ error: "Données invalides" }); return; }

  const [row] = await db.insert(beneficiariesTable).values({ userId, ...data }).returning();
  res.status(201).json(row);
});

router.patch("/beneficiaries/:id", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const body = req.body as any;
  const update: Record<string, string | undefined> = {};
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body.iban === "string") update.iban = body.iban;
  if (typeof body.email === "string") update.email = body.email;
  if (typeof body.phone === "string") update.phone = body.phone;
  if (typeof body.note === "string") update.note = body.note;

  const [updated] = await db
    .update(beneficiariesTable)
    .set(update)
    .where(and(eq(beneficiariesTable.id, id), eq(beneficiariesTable.userId, userId)))
    .returning();

  if (!updated) { res.status(404).json({ error: "Bénéficiaire introuvable" }); return; }
  res.json(updated);
});

router.delete("/beneficiaries/:id", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db
    .delete(beneficiariesTable)
    .where(and(eq(beneficiariesTable.id, id), eq(beneficiariesTable.userId, userId)));

  res.json({ success: true });
});

export default router;
