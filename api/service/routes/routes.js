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
  requireCatalogStaff,
} from "../../../auth/middleware/middleware.js";

const router = Router();

// Public / user read access
router.get("/", listServicesController);
router.get("/:id", getServiceController);

// Write operations restricted to admin/superadmin
router.post(
  "/",
  authenticate,
  requireCatalogStaff,
  createServiceController
);

router.put(
  "/:id",
  authenticate,
  requireCatalogStaff,
  updateServiceController
);

router.delete(
  "/:id",
  authenticate,
  requireCatalogStaff,
  deleteServiceController
);

export default router;
