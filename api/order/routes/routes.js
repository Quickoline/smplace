import { Router } from "express";
import {
  createOrderController,
  listMyOrdersController,
  listAllOrdersController,
  listPartnerReviewsController,
  getOrderController,
  acceptOrderController,
  updateOrderStatusController,
  addRatingController,
  addCustomerRatingController,
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

// Partner profile: all customer reviews for this provider (marketplace users)
router.get(
  "/partner/:providerId/reviews",
  authenticate,
  listPartnerReviewsController
);

// Single order
router.get("/:id", authenticate, getOrderController);

// Claim pending order (assigns current staff as provider → processing)
router.post(
  "/:id/accept",
  authenticate,
  requireOrderStaff,
  acceptOrderController
);

// Update status - admin / superadmin
// body: { status }
router.patch(
  "/:id/status",
  authenticate,
  requireOrderStaff,
  updateOrderStatusController
);

// Add rating - only creator
// body: { rating, ratingComment? }
router.patch("/:id/rating", authenticate, addRatingController);

// Partner rates customer (order provider or superadmin)
// body: { rating, ratingComment? }
router.patch(
  "/:id/customer-rating",
  authenticate,
  requireOrderStaff,
  addCustomerRatingController
);

export default router;

