import { Router } from "express";
import { createFeedbackController } from "../controller/controller.js";
import { optionalAuthenticate } from "../../../auth/middleware/middleware.js";

const router = Router();

router.post("/", optionalAuthenticate, createFeedbackController);

export default router;
