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

// --- Public GET (no auth): list + single category ---
// Canonical: GET /categories  (also mounted at /service-categories for compatibility)
router.get("/", listCategoriesController);

// Legacy alias — same payload as GET /
router.get("/public", listCategoriesController);

// Staff tree (before /:id)
router.get(
  "/admin/with-services",
  authenticate,
  requireStaffCategoryTree,
  adminCategoriesWithServicesController
);

router.get("/:id", getCategoryController);

// --- Catalog staff (mutations + authenticated reads not needed for list) ---
router.post(
  "/",
  authenticate,
  requireCatalogStaff,
  createCategoryController
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
