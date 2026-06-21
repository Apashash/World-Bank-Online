import { Router } from "express";
import { db, activityTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// GET /api/notifications — paginated list of all activity items
router.get("/notifications", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const limit = Math.min(Number(req.query["limit"] ?? 50), 100);
  const offset = Number(req.query["offset"] ?? 0);

  const rows = await db
    .select()
    .from(activityTable)
    .where(eq(activityTable.userId, userId))
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
