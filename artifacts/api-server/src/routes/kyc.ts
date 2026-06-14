import { Router } from "express";
import { db, kycTable, usersTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { SubmitKycBody } from "@workspace/api-zod";

const router = Router();

function formatKyc(k: typeof kycTable.$inferSelect) {
  return {
    id: k.id,
    userId: k.userId,
    documentType: k.documentType,
    documentNumber: k.documentNumber ?? null,
    status: k.status,
    rejectionReason: k.rejectionReason ?? null,
    submittedAt: k.submittedAt.toISOString(),
    reviewedAt: k.reviewedAt?.toISOString() ?? null,
  };
}

router.get("/kyc", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const kycs = await db.select().from(kycTable).where(eq(kycTable.userId, userId)).limit(1);
  if (kycs.length === 0) { res.status(404).json({ error: "No KYC submission found" }); return; }
  res.json(formatKyc(kycs[0]));
});

router.post("/kyc", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const parsed = SubmitKycBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const { documentType, documentNumber, documentFrontUrl, documentBackUrl, selfieUrl } = parsed.data;

  const existing = await db.select().from(kycTable).where(eq(kycTable.userId, userId)).limit(1);
  let kyc;
  if (existing.length > 0) {
    [kyc] = await db.update(kycTable).set({
      documentType,
      documentNumber,
      documentFrontUrl,
      documentBackUrl: documentBackUrl ?? null,
      selfieUrl,
      status: "pending",
      rejectionReason: null,
      submittedAt: new Date(),
      reviewedAt: null,
    }).where(eq(kycTable.userId, userId)).returning();
  } else {
    [kyc] = await db.insert(kycTable).values({
      userId,
      documentType,
      documentNumber,
      documentFrontUrl,
      documentBackUrl: documentBackUrl ?? null,
      selfieUrl,
      status: "pending",
    }).returning();
  }

  await db.update(usersTable).set({ kycStatus: "pending" }).where(eq(usersTable.id, userId));
  await db.insert(activityTable).values({
    userId,
    type: "kyc_updated",
    description: "Documents KYC soumis pour vérification",
  });

  res.status(201).json(formatKyc(kyc));
});

export { formatKyc };
export default router;
