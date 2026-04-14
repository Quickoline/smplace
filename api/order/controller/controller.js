import {
  createOrder,
  listMyOrders,
  listAllOrders,
  getOrderById,
  updateOrderStatus,
  addRating,
  acceptOrder,
  addCustomerRatingByProvider,
  serviceAdminMayAccessOrder,
} from "../services/services.js";
import {
  canManageOrders,
  isSuperadmin,
  ROLES,
} from "../../../auth/roles.js";

function staffUserId(req) {
  return req.user?.id ?? req.user?._id;
}

function providerIdFromOrder(order) {
  const p = order.provider;
  if (!p) return null;
  if (typeof p === "object" && p._id) return String(p._id);
  return String(p);
}

export const createOrderController = async (req, res) => {
  try {
    const { serviceId, source } = req.body;
    const order = await createOrder({
      serviceId,
      source,
      userId: staffUserId(req),
    });
    res.status(201).json({ message: "Order created", order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listMyOrdersController = async (req, res) => {
  try {
    const orders = await listMyOrders(staffUserId(req));
    res.status(200).json({ orders: orders ?? [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listAllOrdersController = async (req, res) => {
  try {
    const orders = await listAllOrders(staffUserId(req), req.user.role);
    res.status(200).json({ orders: orders ?? [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderController = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);

    // access control:
    // - End customers: any token that is not order/superadmin staff (incl. missing role in JWT)
    // - superadmin / order staff: below
    const userId = staffUserId(req);
    const role = req.user.role;

    if (!isSuperadmin(role) && !canManageOrders(role)) {
      if (String(order.createdBy) !== String(userId)) {
        return res.status(403).json({ message: "Not allowed to view this order" });
      }
      return res.status(200).json({ order });
    }

    if (isSuperadmin(role)) {
      return res.status(200).json({ order });
    }

    if (canManageOrders(role)) {
      if (role === ROLES.SERVICE_ADMIN) {
        const ok = await serviceAdminMayAccessOrder(order, userId);
        if (ok) return res.status(200).json({ order });
        return res.status(403).json({ message: "Not allowed to view this order" });
      }

      const pId = providerIdFromOrder(order);
      if (pId && pId === String(userId)) {
        return res.status(200).json({ order });
      }
      if (order.status === "pending" && !pId) {
        return res.status(200).json({ order });
      }
    }

    return res.status(403).json({ message: "Not allowed to view this order" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const acceptOrderController = async (req, res) => {
  try {
    const order = await acceptOrder(
      req.params.id,
      staffUserId(req),
      req.user.role
    );
    res.status(200).json({
      message: "Order accepted. You are assigned to this order and chat.",
      order,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateOrderStatusController = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await updateOrderStatus(
      req.params.id,
      status,
      staffUserId(req),
      req.user.role
    );
    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addRatingController = async (req, res) => {
  try {
    const { rating, ratingComment } = req.body;
    const order = await addRating(
      req.params.id,
      rating,
      ratingComment,
      staffUserId(req)
    );
    res.status(200).json({ message: "Rating added", order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/** Partner / superadmin rates the customer for this order. */
export const addCustomerRatingController = async (req, res) => {
  try {
    const { rating, ratingComment } = req.body;
    const order = await addCustomerRatingByProvider(
      req.params.id,
      rating,
      ratingComment,
      staffUserId(req),
      req.user.role
    );
    res.status(200).json({ message: "Customer rating saved", order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

