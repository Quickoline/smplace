import { Router } from "express";
import {
  createServiceController,
  listServicesController,
  getServiceController,
  updateServiceController,
  deleteServiceController,
} from "../controller/controller.js";
import {
  authenticate,
  requireServiceWriteStaff,
} from "../../../auth/middleware/middleware.js";

const router = Router();

// Public / user read access
router.get("/", listServicesController);
router.get("/:id", getServiceController);

// Write operations restricted to admin/superadmin
router.post(
  "/",
  authenticate,
  requireServiceWriteStaff,
  createServiceController
);

router.put(
  "/:id",
  authenticate,
  requireServiceWriteStaff,
  updateServiceController
);

router.delete(
  "/:id",
  authenticate,
  requireServiceWriteStaff,
  deleteServiceController
);

export default router;
