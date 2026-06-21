import { Router } from "express";
import { db, activityTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

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
