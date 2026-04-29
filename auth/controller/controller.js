import {
  registerUser,
  loginUserOrAdmin,
  loginStaffByEmailPassword,
  createAdminBySuperAdmin,
  listStaffAccounts,
  updateStaffAccountBySuperadmin,
  getUserProfile,
  updateUserProfile,
  listAllUsersForSuperadmin,
  getSuperadminDashboardStats,
  requestPasswordResetForUser,
  resetPasswordWithToken,
} from "../services/services.js";

export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body ?? {};
    const result = await requestPasswordResetForUser(email);
    if (result) {
      res.status(200).json({
        message: "Open the reset page to choose a new password.",
        token: result.token,
        resetUrl: result.resetUrl,
      });
    } else {
      res.status(200).json({
        message:
          "If an account exists for that email, you can reset your password from the next step.",
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { token, password } = req.body ?? {};
    await resetPasswordWithToken(token, password);
    res.status(200).json({
      message: "Password updated. You can sign in with your new password.",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const registerUserController = async (req, res) => {
  try {
    const { email, phone, password, name } = req.body;
    const result = await registerUser({ email, phone, password, name });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: result.user._id,
        email: result.user.email,
        name: result.user.name ?? null,
        phone: result.user.phone,
        role: result.user.role,
      },
      token: result.token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password, role, phone, employeeId } = req.body;

    const result = await loginUserOrAdmin({
      email,
      password,
      role,
      phone,
      employeeId,
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: result.user._id,
        email: result.user.email,
        name: result.user.name ?? null,
        phone: result.user.phone,
        employeeId: result.user.employeeId,
        qrCodeUrl: result.user.qrCodeUrl,
        role: result.user.role,
        ratingAverage: result.user.ratingAverage ?? null,
        ratingCount: result.user.ratingCount ?? 0,
      },
      token: result.token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const adminLoginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginStaffByEmailPassword({ email, password });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: result.user._id,
        email: result.user.email,
        name: result.user.name ?? null,
        phone: result.user.phone,
        employeeId: result.user.employeeId,
        qrCodeUrl: result.user.qrCodeUrl,
        role: result.user.role,
        ratingAverage: result.user.ratingAverage ?? null,
        ratingCount: result.user.ratingCount ?? 0,
      },
      token: result.token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createAdminController = async (req, res) => {
  try {
    const { email, name, employeeId, password, phone, qrCodeUrl, role } =
      req.body;

    const result = await createAdminBySuperAdmin({
      email,
      name,
      employeeId,
      password,
      phone,
      qrCodeUrl,
      role,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: result.admin._id,
        email: result.admin.email,
        name: result.admin.name ?? null,
        employeeId: result.admin.employeeId,
        phone: result.admin.phone,
        qrCodeUrl: result.admin.qrCodeUrl,
        role: result.admin.role,
      },
      token: result.token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listStaffAccountsController = async (req, res) => {
  try {
    const staff = await listStaffAccounts();
    res.status(200).json({ staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** PATCH body: any of name, phone, employeeId, email, qrCodeUrl, role, password (non-empty). */
export const updateStaffAccountController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, employeeId, email, qrCodeUrl, role, password } =
      req.body ?? {};
    const hasField =
      name !== undefined ||
      phone !== undefined ||
      employeeId !== undefined ||
      email !== undefined ||
      qrCodeUrl !== undefined ||
      role !== undefined ||
      (password !== undefined &&
        password !== null &&
        String(password).length > 0);
    if (!hasField) {
      return res.status(400).json({
        message:
          "Provide at least one field: name, phone, employeeId, email, qrCodeUrl, role, or password",
      });
    }
    const staff = await updateStaffAccountBySuperadmin({
      actorId: req.user.id,
      targetUserId: id,
      name,
      phone,
      employeeId,
      email,
      qrCodeUrl,
      role,
      password,
    });
    res.status(200).json({ message: "Staff updated", staff });
  } catch (error) {
    const msg = error.message || "Update failed";
    const code = /not found/i.test(msg) ? 404 : 400;
    res.status(code).json({ message: msg });
  }
};

export const getProfileController = async (req, res) => {
  try {
    const user = await getUserProfile(req.user.id);
    res.status(200).json({ user });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateProfileController = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (name === undefined && phone === undefined) {
      return res.status(400).json({
        message: "Provide at least one of: name, phone",
      });
    }
    const user = await updateUserProfile(req.user.id, { name, phone });
    res.status(200).json({
      message: "Profile updated",
      user,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadQrController = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const url = `/uploads/qr/${req.file.filename}`;
  res.status(200).json({ url });
};

export const listAllUsersController = async (req, res) => {
  try {
    const users = await listAllUsersForSuperadmin();
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const superadminDashboardStatsController = async (req, res) => {
  try {
    const stats = await getSuperadminDashboardStats();
    res.status(200).json({ stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
