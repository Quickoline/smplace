import { Router } from "express";
import {
  createCategoryController,
  listCategoriesController,
  getCategoryController,
  updateCategoryController,
  deleteCategoryController,
  addSubcategoryController,
  removeSubcategoryController,
  adminCategoriesWithServicesController,
} from "../controller/controller.js";
import { authenticate, requireRole } from "../../../../auth/middleware/middleware.js";

const router = Router();

// Public: list categories for user to select
router.get("/public", listCategoriesController);

// Admin view: categories / subcategories with his services (before :id)
router.get(
  "/admin/with-services",
  authenticate,
  requireRole("admin", "superadmin"),
  adminCategoriesWithServicesController
);

// Superadmin-only CRUD for categories & subcategories
router.get("/", authenticate, requireRole("superadmin"), listCategoriesController);
router.post(
  "/",
  authenticate,
  requireRole("superadmin"),
  createCategoryController
);

router.get(
  "/:id",
  authenticate,
  requireRole("superadmin"),
  getCategoryController
);

router.put(
  "/:id",
  authenticate,
  requireRole("superadmin"),
  updateCategoryController
);

router.delete(
  "/:id",
  authenticate,
  requireRole("superadmin"),
  deleteCategoryController
);

router.post(
  "/:id/subcategories",
  authenticate,
  requireRole("superadmin"),
  addSubcategoryController
);

router.delete(
  "/:id/subcategories/:subId",
  authenticate,
  requireRole("superadmin"),
  removeSubcategoryController
);

export default router;

