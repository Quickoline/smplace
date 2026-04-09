import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../model/model.js";
import {
  normalizeCreatableStaffRole,
  STAFF_LOGIN_WITH_EMPLOYEE_ID,
} from "../roles.js";

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";
const JWT_EXPIRES_IN = "7d";

const generateToken = (user) =>
  jwt.sign(
    {
      id: user._id?.toString?.() ?? String(user._id),
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

export const registerUser = async ({ email, phone, password }) => {
  if (!email || !phone || !password) {
    throw new Error("email, phone and password are required");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error("Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    phone,
    passwordHash,
    role: "user",
  });

  const token = generateToken(user);
  return { user, token };
};

export const loginUserOrAdmin = async ({
  email,
  password,
  role,
  phone,
  employeeId,
}) => {
  if (!email || !password || !role) {
    throw new Error("email, password and role are required");
  }

  if (STAFF_LOGIN_WITH_EMPLOYEE_ID.has(role) && !employeeId) {
    throw new Error("employeeId is required for staff login");
  }

  const query = { email, role };
  if (role === "user") {
    if (phone) {
      query.phone = phone;
    }
  }
  if (STAFF_LOGIN_WITH_EMPLOYEE_ID.has(role)) {
    query.employeeId = employeeId;
  }

  const user = await User.findOne(query);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken(user);
  return { user, token };
};

export const createAdminBySuperAdmin = async ({
  email,
  employeeId,
  password,
  phone,
  phoneLast4,
  qrCodeUrl,
  createdBy,
  role: staffRole,
}) => {
  if (!email || !employeeId || !password) {
    throw new Error("email, employeeId and password are required");
  }

  const creator = await User.findById(createdBy);
  if (!creator || creator.role !== "superadmin") {
    throw new Error("Only superadmin can create admin");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error("Email already in use");
  }

  if (!phone || !phoneLast4 || String(phoneLast4).length !== 4) {
    throw new Error("phone and phoneLast4 (4 digits) are required for admin");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const role = normalizeCreatableStaffRole(staffRole);

  const admin = await User.create({
    email,
    employeeId,
    phone,
    phoneLast4: String(phoneLast4).slice(0, 4),
    qrCodeUrl: qrCodeUrl || null,
    passwordHash,
    role,
  });

  const token = generateToken(admin);
  return { admin, token };
};
