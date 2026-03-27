import { Router } from "express";
import {
  createListingController,
  listListingsController,
  getListingController,
  updateListingController,
  deleteListingController,
} from "../controller/controller.js";
import { authenticate, requireRole } from "../../../auth/middleware/middleware.js";

const router = Router();

// Public / user read access
router.get("/", listListingsController);
router.get("/:id", getListingController);

// Write operations restricted to admin/superadmin
router.post(
  "/",
  authenticate,
  requireRole("admin", "superadmin"),
  createListingController
);

router.put(
  "/:id",
  authenticate,
  requireRole("admin", "superadmin"),
  updateListingController
);

router.delete(
  "/:id",
  authenticate,
  requireRole("admin", "superadmin"),
  deleteListingController
);

export default router;

