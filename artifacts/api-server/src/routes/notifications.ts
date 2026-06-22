import { Router } from "express";
import { db, activityTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// GET /api/notifications — paginated list of activity items, optional ?types=transfer_sent,deposit
router.get("/notifications", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const limit = Math.min(Number(req.query["limit"] ?? 50), 100);
  const offset = Number(req.query["offset"] ?? 0);
  const typesParam = req.query["types"] as string | undefined;
  const allowedTypes = [
    "transfer_sent", "transfer_received", "transfer_confirmed",
    "sub_account_created", "kyc_updated", "login",
    "referral_joined", "deposit", "withdrawal", "bill_payment",
  ];
  const requestedTypes = typesParam
    ? typesParam.split(",").filter((t) => allowedTypes.includes(t))
    : [];

  const condition = requestedTypes.length > 0
    ? and(eq(activityTable.userId, userId), inArray(activityTable.type, requestedTypes as any[]))
    : eq(activityTable.userId, userId);

  const rows = await db
    .select()
    .from(activityTable)
    .where(condition)
    .orderBy(desc(activityTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(rows);
});

// GET /api/notifications/count — number of unread activity items
router.get("/notifications/count", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;

  const rows = await db
    .select({ id: activityTable.id })
    .from(activityTable)
    .where(and(eq(activityTable.userId, userId), eq(activityTable.isRead, false)));

  res.json({ count: rows.length });
});

// POST /api/notifications/:id/read — mark one as read
router.post("/notifications/:id/read", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db
    .update(activityTable)
    .set({ isRead: true })
    .where(and(eq(activityTable.id, id), eq(activityTable.userId, userId)));

  res.json({ success: true });
});

// POST /api/notifications/mark-read — mark all as read
router.post("/notifications/mark-read", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;

  await db
    .update(activityTable)
    .set({ isRead: true })
    .where(and(eq(activityTable.userId, userId), eq(activityTable.isRead, false)));

  res.json({ success: true });
});

export default router;
