import {
  createOrder,
  listMyOrders,
  listAllOrders,
  getOrderById,
  updateOrderStatus,
  addRating,
} from "../services/services.js";
import {
  canManageOrders,
  isSuperadmin,
} from "../../../auth/roles.js";

export const createOrderController = async (req, res) => {
  try {
    const { serviceId, source } = req.body;
    const order = await createOrder({
      serviceId,
      source,
      userId: req.user?.id,
    });
    res.status(201).json({ message: "Order created", order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listMyOrdersController = async (req, res) => {
  try {
    const orders = await listMyOrders(req.user.id);
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listAllOrdersController = async (req, res) => {
  try {
    const orders = await listAllOrders(req.user.id, req.user.role);
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderController = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);

    // access control:
    // - user: only own orders
    // - admin: only orders for services they own
    // - superadmin: all
    const userId = req.user.id;
    const role = req.user.role;

    if (role === "user") {
      if (String(order.createdBy) !== String(userId)) {
        return res.status(403).json({ message: "Not allowed to view this order" });
      }
      return res.status(200).json({ order });
    }

    if (isSuperadmin(role)) {
      return res.status(200).json({ order });
    }

    if (
      canManageOrders(role) &&
      order.provider &&
      String(order.provider) === String(userId)
    ) {
      return res.status(200).json({ order });
    }

    return res.status(403).json({ message: "Not allowed to view this order" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateOrderStatusController = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await updateOrderStatus(
      req.params.id,
      status,
      req.user.id,
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
      req.user.id
    );
    res.status(200).json({ message: "Rating added", order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

