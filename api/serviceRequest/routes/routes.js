import { Router } from "express";
import {
  createServiceRequestController,
  listServiceRequestsController,
} from "../controller/controller.js";
import {
  authenticate,
  requireRole,
  requireSuperadmin,
} from "../../../auth/middleware/middleware.js";
import { ROLES } from "../../../auth/roles.js";

const router = Router();

router.post(
  "/",
  authenticate,
  requireRole(ROLES.USER),
  createServiceRequestController
);

router.get(
  "/",
  authenticate,
  requireSuperadmin,
  listServiceRequestsController
);

export default router;
