import { Router } from "express";
import {
  registerUserController,
  loginController,
  adminLoginController,
  createAdminController,
  listStaffAccountsController,
  updateStaffAccountController,
  uploadQrController,
  getProfileController,
  updateProfileController,
  forgotPasswordController,
  resetPasswordController,
} from "../controller/controller.js";
import {
  authenticate,
  requireRole,
  requireSuperadmin,
} from "../middleware/middleware.js";
import { uploadQr } from "../../utils/upload_qr.js";

const router = Router();

// User registration: email + phone + password
router.post("/register", registerUserController);

// Password reset (marketplace users) — email via nodemailer
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

// Login for both user and admin
// body: { email, password, role, phone? (for user), employeeId? (for admin) }
router.post("/login", loginController);

// Admin app: staff only — body: { email, password }
router.post("/admin/login", adminLoginController);

// Authenticated profile (all roles)
router.get("/profile", authenticate, getProfileController);
router.put("/profile", authenticate, updateProfileController);

// Staff directory — superadmin only
router.get(
  "/staff",
  authenticate,
  requireSuperadmin,
  listStaffAccountsController
);
router.patch(
  "/staff/:id",
  authenticate,
  requireSuperadmin,
  updateStaffAccountController
);

// Upload QR for admin (superadmin) - multipart file
router.post(
  "/upload-qr",
  authenticate,
  requireRole("superadmin"),
  uploadQr.single("file"),
  uploadQrController
);

// Create admin - only superadmin
// body: { email, name, employeeId, password, phone, qrCodeUrl?, role? }
router.post(
  "/admin",
  authenticate,
  requireRole("superadmin"),
  createAdminController
);

export default router;
