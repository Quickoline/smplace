import { Router } from "express";
import {
  registerUserController,
  loginController,
  createAdminController,
  uploadQrController,
} from "../controller/controller.js";
import { authenticate, requireRole } from "../middleware/middleware.js";
import { uploadQr } from "../../utils/upload_qr.js";

const router = Router();

// User registration: email + phone + password
router.post("/register", registerUserController);

// Login for both user and admin
// body: { email, password, role, phone? (for user), employeeId? (for admin) }
router.post("/login", loginController);

// Upload QR for admin (superadmin) - multipart file
router.post(
  "/upload-qr",
  authenticate,
  requireRole("superadmin"),
  uploadQr.single("file"),
  uploadQrController
);

// Create admin - only superadmin
// body: { email, employeeId, password, phone, phoneLast4, qrCodeUrl? }
router.post(
  "/admin",
  authenticate,
  requireRole("superadmin"),
  createAdminController
);

export default router;
