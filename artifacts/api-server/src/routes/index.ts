import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import transfersRouter from "./transfers";
import subAccountsRouter from "./sub-accounts";
import referralsRouter from "./referrals";
import kycRouter from "./kyc";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import walletRouter from "./wallet";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(transfersRouter);
router.use(subAccountsRouter);
router.use(referralsRouter);
router.use(kycRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(walletRouter);
router.use(notificationsRouter);

export default router;
