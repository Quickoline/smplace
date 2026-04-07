import { Router } from "express";
import {
  createPaymentController,
  getPaymentController,
  listPaymentsController,
  verifyPaymentController,
} from "../controller/controller.js";
import {
  authenticate,
  requireOrderStaff,
} from "../../../auth/middleware/middleware.js";

const router = Router();

// Admin: Create payment request (Get Payment flow)
// body: { orderId, amount, type: 'gst' | 'non_gst' }
router.post(
  "/",
  authenticate,
  requireOrderStaff,
  createPaymentController
);

// Get latest payment for order (user or admin)
router.get("/order/:orderId", authenticate, getPaymentController);

// List all payments for order
router.get("/order/:orderId/list", authenticate, listPaymentsController);

// Admin: Verify payment (marks paid, updates order to payment_verified, adds to user wallet)
router.post(
  "/:id/verify",
  authenticate,
  requireOrderStaff,
  verifyPaymentController
);

export default router;
