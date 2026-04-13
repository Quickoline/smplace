import { Router } from "express";
import {
  createOrderController,
  listMyOrdersController,
  listAllOrdersController,
  getOrderController,
  updateOrderStatusController,
  addRatingController,
} from "../controller/controller.js";
import {
  authenticate,
  requireOrderStaff,
} from "../../../auth/middleware/middleware.js";

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
  requireOrderStaff,
  listAllOrdersController
);

// Single order
router.get("/:id", authenticate, getOrderController);

// Update status - admin / superadmin
// body: { status }
router.patch(
  "/:id/status",
  authenticate,
  requireOrderStaff,
  updateOrderStatusController
);

// Add rating - only creator
// body: { rating }
router.patch("/:id/rating", authenticate, addRatingController);

export default router;

