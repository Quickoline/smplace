/** Role strings stored on User.role and JWT payload */

export const ROLES = {
  USER: "user",
  /** Legacy: same capabilities as service_admin for orders/payments */
  ADMIN: "admin",
  SENIOR_ADMIN: "senior_admin",
  SERVICE_ADMIN: "service_admin",
  SUPERADMIN: "superadmin",
};

const CATALOG = new Set([ROLES.SUPERADMIN, ROLES.SENIOR_ADMIN]);

const ORDERS = new Set([ROLES.SUPERADMIN, ROLES.SERVICE_ADMIN, ROLES.ADMIN]);

/** Log in with email + employeeId */
export const STAFF_LOGIN_WITH_EMPLOYEE_ID = new Set([
  ROLES.ADMIN,
  ROLES.SENIOR_ADMIN,
  ROLES.SERVICE_ADMIN,
]);

/** Admin app: sign in with email + password only (role comes from the account) */
export const STAFF_EMAIL_LOGIN_ROLES = new Set([
  ROLES.ADMIN,
  ROLES.SENIOR_ADMIN,
  ROLES.SERVICE_ADMIN,
  ROLES.SUPERADMIN,
]);

export const isSuperadmin = (role) => role === ROLES.SUPERADMIN;

export const canManageCatalog = (role) => CATALOG.has(role);

export const canManageOrders = (role) => ORDERS.has(role);

/** Categories "admin tree" + similar: anyone who is staff for catalog or fulfillment */
export const canUseStaffCategoryTree = (role) =>
  canManageCatalog(role) || canManageOrders(role);

const CREATABLE_STAFF_ROLES = new Set([
  ROLES.SENIOR_ADMIN,
  ROLES.SERVICE_ADMIN,
  ROLES.ADMIN,
]);

export const normalizeCreatableStaffRole = (role) => {
  if (role && CREATABLE_STAFF_ROLES.has(role)) return role;
  return ROLES.SERVICE_ADMIN;
};
