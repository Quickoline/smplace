import { Router } from "express";
import { createContactController } from "../controller/controller.js";
import { optionalAuthenticate } from "../../../auth/middleware/middleware.js";

const router = Router();

// POST /contact  — public; optional Bearer links submission to account
router.post("/", optionalAuthenticate, createContactController);

export default router;
