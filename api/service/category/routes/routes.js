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
import {
  authenticate,
  requireCatalogStaff,
  requireStaffCategoryTree,
} from "../../../../auth/middleware/middleware.js";

const router = Router();

// Public: list categories for user to select
router.get("/public", listCategoriesController);

// Admin view: categories / subcategories with his services (before :id)
router.get(
  "/admin/with-services",
  authenticate,
  requireStaffCategoryTree,
  adminCategoriesWithServicesController
);

// Admin CRUD for categories & subcategories (same roles as /services writes)
router.get(
  "/",
  authenticate,
  requireCatalogStaff,
  listCategoriesController
);
router.post(
  "/",
  authenticate,
  requireCatalogStaff,
  createCategoryController
);

router.get(
  "/:id",
  authenticate,
  requireCatalogStaff,
  getCategoryController
);

router.put(
  "/:id",
  authenticate,
  requireCatalogStaff,
  updateCategoryController
);

router.delete(
  "/:id",
  authenticate,
  requireCatalogStaff,
  deleteCategoryController
);

router.post(
  "/:id/subcategories",
  authenticate,
  requireCatalogStaff,
  addSubcategoryController
);

router.delete(
  "/:id/subcategories/:subId",
  authenticate,
  requireCatalogStaff,
  removeSubcategoryController
);

export default router;

