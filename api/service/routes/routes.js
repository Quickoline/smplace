import { Router } from "express";
import {
  createServiceController,
  listServicesController,
  getServiceController,
  updateServiceController,
  deleteServiceController,
} from "../controller/controller.js";
import { authenticate, requireRole } from "../../../auth/middleware/middleware.js";

const router = Router();

// Public / user read access
router.get("/", listServicesController);
router.get("/:id", getServiceController);

// Write operations restricted to admin/superadmin
router.post(
  "/",
  authenticate,
  requireRole("admin", "superadmin"),
  createServiceController
);

router.put(
  "/:id",
  authenticate,
  requireRole("admin", "superadmin"),
  updateServiceController
);

router.delete(
  "/:id",
  authenticate,
  requireRole("admin", "superadmin"),
  deleteServiceController
);

export default router;
