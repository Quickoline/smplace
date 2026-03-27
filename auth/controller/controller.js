import {
  registerUser,
  loginUserOrAdmin,
  createAdminBySuperAdmin,
} from "../services/services.js";

export const registerUserController = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const result = await registerUser({ email, phone, password });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: result.user._id,
        email: result.user.email,
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
        phone: result.user.phone,
        employeeId: result.user.employeeId,
        phoneLast4: result.user.phoneLast4,
        qrCodeUrl: result.user.qrCodeUrl,
        role: result.user.role,
      },
      token: result.token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createAdminController = async (req, res) => {
  try {
    const { email, employeeId, password, phone, phoneLast4, qrCodeUrl } =
      req.body;

    const result = await createAdminBySuperAdmin({
      email,
      employeeId,
      password,
      phone,
      phoneLast4,
      qrCodeUrl,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: result.admin._id,
        email: result.admin.email,
        employeeId: result.admin.employeeId,
        phone: result.admin.phone,
        phoneLast4: result.admin.phoneLast4,
        qrCodeUrl: result.admin.qrCodeUrl,
        role: result.admin.role,
      },
      token: result.token,
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
