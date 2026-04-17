import { Router } from "express";
import {
  getWalletController,
  manualWalletAdjustmentController,
} from "../controller/controller.js";
import {
  authenticate,
  requireSuperadmin,
} from "../../../auth/middleware/middleware.js";

const router = Router();

// User: balance + transactions (verified payments + manual adjustments)
router.get("/", authenticate, getWalletController);

// Superadmin: signed amount adjusts customer wallet (INR)
router.post(
  "/manual",
  authenticate,
  requireSuperadmin,
  manualWalletAdjustmentController
);

export default router;
