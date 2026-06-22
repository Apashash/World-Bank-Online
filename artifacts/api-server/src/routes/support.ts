import { Router } from "express";
import { db, supportMessagesTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

function parseContent(body: any): string | null {
  if (!body || typeof body.content !== "string" || !body.content.trim()) return null;
  if (body.content.length > 2000) return null;
  return body.content.trim();
}

// User: get own conversation
router.get("/support/messages", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const rows = await db
    .select()
    .from(supportMessagesTable)
    .where(eq(supportMessagesTable.userId, userId))
    .orderBy(desc(supportMessagesTable.createdAt));
  // Mark admin messages as read
  await db
    .update(supportMessagesTable)
    .set({ isRead: true })
    .where(and(eq(supportMessagesTable.userId, userId), eq(supportMessagesTable.isFromAdmin, true), eq(supportMessagesTable.isRead, false)));
  res.json(rows.reverse());
});

// User: send message
router.post("/support/messages", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const content = parseContent(req.body);
  if (!content) { res.status(400).json({ error: "Contenu invalide" }); return; }

  const [row] = await db
    .insert(supportMessagesTable)
    .values({ userId, content, isFromAdmin: false })
    .returning();
  res.status(201).json(row);
});

// User: unread count
router.get("/support/unread", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const rows = await db
    .select({ id: supportMessagesTable.id })
    .from(supportMessagesTable)
    .where(and(eq(supportMessagesTable.userId, userId), eq(supportMessagesTable.isFromAdmin, true), eq(supportMessagesTable.isRead, false)));
  res.json({ count: rows.length });
});

// Admin: list all conversations (one per user)
router.get("/admin/support/conversations", requireAuth, requireAdmin, async (req, res) => {
  const allUsers = await db.select({ id: usersTable.id, fullName: usersTable.fullName, email: usersTable.email }).from(usersTable);
  const allMsgs = await db.select().from(supportMessagesTable).orderBy(desc(supportMessagesTable.createdAt));

  const byUser: Record<number, { user: { id: number; fullName: string; email: string }; lastMessage: typeof allMsgs[0]; unread: number }> = {};
  for (const msg of allMsgs) {
    if (!byUser[msg.userId]) {
      const user = allUsers.find((u) => u.id === msg.userId);
      if (!user) continue;
      byUser[msg.userId] = { user, lastMessage: msg, unread: 0 };
    }
    if (!msg.isFromAdmin && !msg.isRead) byUser[msg.userId].unread++;
  }

  res.json(Object.values(byUser).sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()));
});

// Admin: get conversation for a user
router.get("/admin/support/:userId/messages", requireAuth, requireAdmin, async (req, res) => {
  const uid = parseInt(req.params["userId"] as string);
  const rows = await db
    .select()
    .from(supportMessagesTable)
    .where(eq(supportMessagesTable.userId, uid))
    .orderBy(supportMessagesTable.createdAt);

  // Mark user messages as read
  await db
    .update(supportMessagesTable)
    .set({ isRead: true })
    .where(and(eq(supportMessagesTable.userId, uid), eq(supportMessagesTable.isFromAdmin, false), eq(supportMessagesTable.isRead, false)));

  res.json(rows);
});

// Admin: reply to user
router.post("/admin/support/:userId/messages", requireAuth, requireAdmin, async (req, res) => {
  const uid = parseInt(req.params["userId"] as string);
  const content = parseContent(req.body);
  if (!content) { res.status(400).json({ error: "Contenu invalide" }); return; }

  const [row] = await db
    .insert(supportMessagesTable)
    .values({ userId: uid, content, isFromAdmin: true })
    .returning();
  res.status(201).json(row);
});

export default router;
