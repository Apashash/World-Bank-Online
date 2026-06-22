import { Router } from "express";
import { db, exchangeRatesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

function parseRateBody(body: any): { fromCurrency: string; toCurrency: string; rate: number } | null {
  if (!body) return null;
  const from = typeof body.fromCurrency === "string" ? body.fromCurrency.trim().toUpperCase() : "";
  const to = typeof body.toCurrency === "string" ? body.toCurrency.trim().toUpperCase() : "";
  const rate = typeof body.rate === "number" ? body.rate : parseFloat(body.rate);
  if (!from || !to || isNaN(rate) || rate <= 0) return null;
  return { fromCurrency: from, toCurrency: to, rate };
}

// Public: get all rates
router.get("/exchange-rates", requireAuth, async (_req, res) => {
  const rows = await db.select().from(exchangeRatesTable);
  res.json(rows);
});

// Public: convert
router.get("/exchange-rates/convert", requireAuth, async (req, res) => {
  const from = (req.query["from"] as string)?.toUpperCase();
  const to = (req.query["to"] as string)?.toUpperCase();
  const amount = parseFloat(req.query["amount"] as string);

  if (!from || !to || isNaN(amount)) { res.status(400).json({ error: "Paramètres manquants" }); return; }
  if (from === to) { res.json({ result: amount, rate: 1 }); return; }

  const [rateRow] = await db
    .select()
    .from(exchangeRatesTable)
    .where(and(eq(exchangeRatesTable.fromCurrency, from), eq(exchangeRatesTable.toCurrency, to)))
    .limit(1);

  if (!rateRow) { res.status(404).json({ error: "Taux introuvable pour cette paire" }); return; }
  const result = amount * Number(rateRow.rate);
  res.json({ result: Math.round(result * 100) / 100, rate: Number(rateRow.rate) });
});

// Admin: create or update rate
router.put("/admin/exchange-rates", requireAuth, requireAdmin, async (req, res) => {
  const parsed = parseRateBody(req.body);
  if (!parsed) { res.status(400).json({ error: "Données invalides" }); return; }

  const { fromCurrency, toCurrency, rate } = parsed;

  const existing = await db
    .select()
    .from(exchangeRatesTable)
    .where(and(eq(exchangeRatesTable.fromCurrency, fromCurrency), eq(exchangeRatesTable.toCurrency, toCurrency)))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(exchangeRatesTable)
      .set({ rate: rate.toString(), updatedAt: new Date() })
      .where(eq(exchangeRatesTable.id, existing[0].id))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db
      .insert(exchangeRatesTable)
      .values({ fromCurrency, toCurrency, rate: rate.toString() })
      .returning();
    res.status(201).json(created);
  }
});

// Admin: delete rate
router.delete("/admin/exchange-rates/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(exchangeRatesTable).where(eq(exchangeRatesTable.id, id));
  res.json({ success: true });
});

// Seed common rates if empty
router.post("/admin/exchange-rates/seed", requireAuth, requireAdmin, async (_req, res) => {
  const existing = await db.select().from(exchangeRatesTable);
  if (existing.length > 0) { res.json({ message: "Déjà initialisé", count: existing.length }); return; }

  const seeds = [
    { fromCurrency: "EUR", toCurrency: "USD", rate: "1.08" },
    { fromCurrency: "USD", toCurrency: "EUR", rate: "0.9259" },
    { fromCurrency: "EUR", toCurrency: "GBP", rate: "0.856" },
    { fromCurrency: "GBP", toCurrency: "EUR", rate: "1.1682" },
    { fromCurrency: "EUR", toCurrency: "CHF", rate: "0.968" },
    { fromCurrency: "CHF", toCurrency: "EUR", rate: "1.0331" },
    { fromCurrency: "USD", toCurrency: "GBP", rate: "0.792" },
    { fromCurrency: "GBP", toCurrency: "USD", rate: "1.2626" },
    { fromCurrency: "EUR", toCurrency: "XOF", rate: "655.957" },
    { fromCurrency: "XOF", toCurrency: "EUR", rate: "0.001524" },
  ];

  await db.insert(exchangeRatesTable).values(seeds);
  res.json({ message: "Taux initialisés", count: seeds.length });
});

export default router;
