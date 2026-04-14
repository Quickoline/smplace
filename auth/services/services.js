import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../model/model.js";
import {
  normalizeCreatableStaffRole,
  normalizeAssignableStaffRole,
  STAFF_EMAIL_LOGIN_ROLES,
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

export const registerUser = async ({ email, phone, password, name }) => {
  const n = name != null ? String(name).trim() : "";
  if (!email || !phone || !password || !n) {
    throw new Error("email, phone, password and name are required");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error("Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    name: n.slice(0, 120),
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

/** Admin mobile/web: email + password; account must be a staff role (not `user`). */
export const loginStaffByEmailPassword = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("email and password are required");
  }

  const e = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: e });
  if (!user || !STAFF_EMAIL_LOGIN_ROLES.has(user.role)) {
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
  name,
  employeeId,
  password,
  phone,
  qrCodeUrl,
  createdBy,
  role: staffRole,
}) => {
  const displayName = name != null ? String(name).trim() : "";
  if (!email || !employeeId || !password || !displayName) {
    throw new Error("email, name, employeeId and password are required");
  }

  const creator = await User.findById(createdBy);
  if (!creator || creator.role !== "superadmin") {
    throw new Error("Only superadmin can create admin");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error("Email already in use");
  }

  if (!phone || !String(phone).trim()) {
    throw new Error("phone is required for admin");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const role = normalizeCreatableStaffRole(staffRole);

  const admin = await User.create({
    email,
    name: displayName.slice(0, 120),
    employeeId,
    phone: String(phone).trim(),
    qrCodeUrl: qrCodeUrl || null,
    passwordHash,
    role,
  });

  const token = generateToken(admin);
  return { admin, token };
};

const STAFF_ACCOUNT_ROLES = [
  "superadmin",
  "senior_admin",
  "service_admin",
  "admin",
];

/** All staff accounts (superadmin dashboard). */
export const listStaffAccounts = async () => {
  const rows = await User.find({ role: { $in: STAFF_ACCOUNT_ROLES } })
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .lean();

  return rows.map(serializeStaffRow);
};

const serializeStaffRow = (u) => ({
  id: u._id?.toString?.() ?? String(u._id),
  email: u.email,
  name: u.name ?? null,
  phone: u.phone ?? null,
  employeeId: u.employeeId ?? null,
  role: u.role,
  qrCodeUrl: u.qrCodeUrl ?? null,
  ratingAverage: u.ratingAverage ?? null,
  ratingCount: u.ratingCount ?? 0,
  createdAt: u.createdAt,
});

/**
 * Superadmin updates any staff account (same role set as staff directory).
 * Optional `password` sets a new bcrypt hash when non-empty.
 */
export const updateStaffAccountBySuperadmin = async ({
  actorId,
  targetUserId,
  name,
  phone,
  employeeId,
  email,
  qrCodeUrl,
  role: nextRole,
  password,
}) => {
  const actor = await User.findById(actorId);
  if (!actor || actor.role !== "superadmin") {
    throw new Error("Only superadmin can update staff");
  }

  const user = await User.findById(targetUserId);
  if (!user || !STAFF_ACCOUNT_ROLES.includes(user.role)) {
    throw new Error("Staff account not found");
  }

  if (
    user.role === "superadmin" &&
    nextRole !== undefined &&
    nextRole !== null &&
    String(nextRole).trim() !== "" &&
    normalizeAssignableStaffRole(String(nextRole).trim()) !== "superadmin"
  ) {
    const superCount = await User.countDocuments({ role: "superadmin" });
    if (superCount <= 1) {
      throw new Error("Cannot remove the last superadmin");
    }
  }

  if (email !== undefined) {
    const e = String(email).trim().toLowerCase();
    if (!e) throw new Error("email cannot be empty");
    if (e !== user.email) {
      const taken = await User.findOne({
        email: e,
        _id: { $ne: user._id },
      }).lean();
      if (taken) throw new Error("Email already in use");
      user.email = e;
    }
  }

  if (name !== undefined) {
    const n = String(name).trim();
    user.name = n.length > 0 ? n.slice(0, 120) : undefined;
  }

  if (phone !== undefined) {
    const p = String(phone).trim();
    if (!p) throw new Error("phone is required for staff");
    user.phone = p;
  }

  if (employeeId !== undefined) {
    const emp = String(employeeId).trim();
    if (!emp) throw new Error("employeeId is required for staff");
    user.employeeId = emp;
  }

  if (qrCodeUrl !== undefined) {
    const q = qrCodeUrl != null ? String(qrCodeUrl).trim() : "";
    user.qrCodeUrl = q.length > 0 ? q : null;
  }

  if (nextRole !== undefined && nextRole !== null && String(nextRole).trim() !== "") {
    user.role = normalizeAssignableStaffRole(String(nextRole).trim());
  }

  if (password !== undefined && password !== null && String(password).length > 0) {
    user.passwordHash = await bcrypt.hash(String(password), 10);
  }

  await user.save();

  const fresh = await User.findById(user._id).select("-passwordHash").lean();
  return serializeStaffRow(fresh);
};

const serializePublicUser = (doc) => {
  if (!doc) return null;
  const u = doc.toObject ? doc.toObject() : doc;
  return {
    id: u._id?.toString?.() ?? String(u._id),
    email: u.email,
    name: u.name ?? null,
    phone: u.phone ?? null,
    role: u.role,
    ratingAverage:
      u.ratingAverage != null ? Number(u.ratingAverage) : null,
    ratingCount: u.ratingCount != null ? Number(u.ratingCount) : 0,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-passwordHash").lean();
  if (!user) {
    throw new Error("User not found");
  }
  return serializePublicUser(user);
};

export const updateUserProfile = async (userId, { name, phone }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (name !== undefined) {
    const n = String(name).trim();
    user.name = n.length > 0 ? n.slice(0, 120) : undefined;
  }
  if (phone !== undefined) {
    const p = String(phone).trim();
    user.phone = p.length > 0 ? p : undefined;
  }

  await user.save();
  return getUserProfile(userId);
};
