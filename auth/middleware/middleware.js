import jwt from "jsonwebtoken";
import {
  canManageCatalog,
  canManageOrders,
  canManageServiceListings,
  canUseStaffCategoryTree,
  isSuperadmin,
} from "../roles.js";

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

export const authenticate = (req, res, next) => {
  let authHeader = req.headers.authorization;
  const rawAlt =
    req.headers["x-auth-token"] || req.headers["x-access-token"];
  const alt = Array.isArray(rawAlt) ? rawAlt[0] : rawAlt;
  if ((!authHeader || !authHeader.startsWith("Bearer ")) && alt) {
    authHeader = `Bearer ${String(alt).trim()}`;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

/** Services, categories, buy/sell listings (catalog) */
export const requireCatalogStaff = (req, res, next) => {
  if (!req.user || !canManageCatalog(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

/** Orders, payments, status updates */
export const requireOrderStaff = (req, res, next) => {
  if (!req.user || !canManageOrders(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

/** Category tree for admin apps (senior sees own listings; ops sees assigned services) */
export const requireStaffCategoryTree = (req, res, next) => {
  if (!req.user || !canUseStaffCategoryTree(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

/** Create/edit/delete service & buy-sell listings (not categories) */
export const requireServiceWriteStaff = (req, res, next) => {
  if (!req.user || !canManageServiceListings(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

export const requireSuperadmin = (req, res, next) => {
  if (!req.user || !isSuperadmin(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

/** Sets req.user when a valid Bearer token is sent; otherwise req.user is undefined. */
export const optionalAuthenticate = (req, res, next) => {
  let authHeader = req.headers.authorization;
  const rawAlt =
    req.headers["x-auth-token"] || req.headers["x-access-token"];
  const alt = Array.isArray(rawAlt) ? rawAlt[0] : rawAlt;
  if ((!authHeader || !authHeader.startsWith("Bearer ")) && alt) {
    authHeader = `Bearer ${String(alt).trim()}`;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = undefined;
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch {
    req.user = undefined;
  }
  next();
};
