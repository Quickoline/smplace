import { Router } from "express";
import {
  createOrderController,
  listMyOrdersController,
  listAllOrdersController,
  getOrderController,
  updateOrderStatusController,
  addRatingController,
  verifyAdminPhoneController,
} from "../controller/controller.js";
import { authenticate, requireRole } from "../../../auth/middleware/middleware.js";

const router = Router();

// Create order for a service or buy-sell listing
// body: { customerName, phone, serviceId, source: 'service' | 'buySell' }
router.post("/", authenticate, createOrderController);

// Current user's orders
router.get("/my", authenticate, listMyOrdersController);

// All orders - admin / superadmin
router.get(
  "/",
  authenticate,
  requireRole("admin", "superadmin"),
  listAllOrdersController
);

// Single order
router.get("/:id", authenticate, getOrderController);

// Update status - admin / superadmin
// body: { status }
router.patch(
  "/:id/status",
  authenticate,
  requireRole("admin", "superadmin"),
  updateOrderStatusController
);

// Add rating - only creator
// body: { rating }
router.patch("/:id/rating", authenticate, addRatingController);

// Verify admin phone last 4 digits before starting chat
// body: { last4 }
router.post(
  "/:id/verify-admin-phone",
  authenticate,
  verifyAdminPhoneController
);

export default router;

