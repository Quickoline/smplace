import { Router } from "express";
import { getWalletController } from "../controller/controller.js";
import { authenticate } from "../../../auth/middleware/middleware.js";

const router = Router();

// User: Get wallet (amounts paid - visible when order status is payment_verified)
router.get("/", authenticate, getWalletController);

export default router;
