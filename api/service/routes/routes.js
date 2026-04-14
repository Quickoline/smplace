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
  optionalAuthenticate,
  requireServiceWriteStaff,
} from "../../../auth/middleware/middleware.js";

const router = Router();

// Public marketplace read; optional auth so service_admin only lists own (see controller).
router.get("/", optionalAuthenticate, listServicesController);
router.get("/:id", optionalAuthenticate, getServiceController);

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
