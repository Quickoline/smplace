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
  requireServiceWriteStaff,
} from "../../../auth/middleware/middleware.js";

const router = Router();

// Public / user read access
router.get("/", listListingsController);
router.get("/:id", getListingController);

// Write operations restricted to admin/superadmin
router.post(
  "/",
  authenticate,
  requireServiceWriteStaff,
  createListingController
);

router.put(
  "/:id",
  authenticate,
  requireServiceWriteStaff,
  updateListingController
);

router.delete(
  "/:id",
  authenticate,
  requireServiceWriteStaff,
  deleteListingController
);

export default router;

