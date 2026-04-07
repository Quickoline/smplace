import { Router } from "express";
import {
  createListingController,
  listListingsController,
  getListingController,
  updateListingController,
  deleteListingController,
} from "../controller/controller.js";
import {
  authenticate,
  requireCatalogStaff,
} from "../../../auth/middleware/middleware.js";

const router = Router();

// Public / user read access
router.get("/", listListingsController);
router.get("/:id", getListingController);

// Write operations restricted to admin/superadmin
router.post(
  "/",
  authenticate,
  requireCatalogStaff,
  createListingController
);

router.put(
  "/:id",
  authenticate,
  requireCatalogStaff,
  updateListingController
);

router.delete(
  "/:id",
  authenticate,
  requireCatalogStaff,
  deleteListingController
);

export default router;

