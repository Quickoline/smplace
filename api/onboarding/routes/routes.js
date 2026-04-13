import { Router } from "express";
import {
  createOnboardingController,
  listOnboardingController,
} from "../controller/controller.js";
import {
  authenticate,
  optionalAuthenticate,
  requireSuperadmin,
} from "../../../auth/middleware/middleware.js";

const router = Router();

router.post("/", optionalAuthenticate, createOnboardingController);
router.get("/", authenticate, requireSuperadmin, listOnboardingController);

export default router;
