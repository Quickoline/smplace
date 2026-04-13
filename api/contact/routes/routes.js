import { Router } from "express";
import {
  createContactController,
  listContactsController,
} from "../controller/controller.js";
import {
  authenticate,
  optionalAuthenticate,
  requireSuperadmin,
} from "../../../auth/middleware/middleware.js";
import { uploadContactFiles } from "../../../utils/upload.js";

const router = Router();

const multipartContact = (req, res, next) => {
  const ct = req.headers["content-type"] || "";
  if (ct.includes("multipart/form-data")) {
    return uploadContactFiles.array("files", 10)(req, res, next);
  }
  next();
};

// POST /contact — JSON (application/json) or multipart (fields + optional files[])
router.post("/", optionalAuthenticate, multipartContact, createContactController);

// Superadmin: list all contact submissions
router.get("/", authenticate, requireSuperadmin, listContactsController);

export default router;
