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

// Admin CRUD for categories & subcategories (same roles as /services writes)
router.get(
  "/",
  authenticate,
  requireRole("admin", "superadmin"),
  listCategoriesController
);
router.post(
  "/",
  authenticate,
  requireRole("admin", "superadmin"),
  createCategoryController
);

router.get(
  "/:id",
  authenticate,
  requireRole("admin", "superadmin"),
  getCategoryController
);

router.put(
  "/:id",
  authenticate,
  requireRole("admin", "superadmin"),
  updateCategoryController
);

router.delete(
  "/:id",
  authenticate,
  requireRole("admin", "superadmin"),
  deleteCategoryController
);

router.post(
  "/:id/subcategories",
  authenticate,
  requireRole("admin", "superadmin"),
  addSubcategoryController
);

router.delete(
  "/:id/subcategories/:subId",
  authenticate,
  requireRole("admin", "superadmin"),
  removeSubcategoryController
);

export default router;

