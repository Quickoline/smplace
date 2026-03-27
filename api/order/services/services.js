import { Order } from "../model/model.js";
import { Service } from "../../service/model/model.js";
import { BuySellListing } from "../../buySell/model/model.js";
import { User } from "../../../auth/model/model.js";

export const createOrder = async ({
  serviceId,
  source, // 'service' | 'buySell'
  userId,
}) => {
  if (!serviceId || !source) {
    throw new Error("serviceId and source are required");
  }

  const user = await User.findById(userId);
  if (!user || !user.phone) {
    throw new Error("User phone is required. Please update your profile.");
  }

  const serviceModel =
    source === "service" ? "Service" : source === "buySell" ? "BuySellListing" : null;

  if (!serviceModel) {
    throw new Error("source must be 'service' or 'buySell'");
  }

  const serviceDoc =
    serviceModel === "Service"
      ? await Service.findById(serviceId)
      : await BuySellListing.findById(serviceId);

  if (!serviceDoc) {
    throw new Error("Related service not found");
  }

  const order = await Order.create({
    customerName: user.email,
    phone: user.phone,
    service: serviceId,
    serviceModel,
    createdBy: userId,
    provider: serviceDoc.createdBy,
  });

  return order.populate("service");
};

export const listMyOrders = async (userId) => {
  return Order.find({ createdBy: userId })
    .sort({ createdAt: -1 })
    .populate("service");
};

export const listAllOrders = async (userId, role) => {
  const filter = role === "superadmin" ? {} : { provider: userId };
  return Order.find(filter).sort({ createdAt: -1 }).populate("service");
};

export const getOrderById = async (id) => {
  const order = await Order.findById(id).populate("service");
  if (!order) {
    throw new Error("Order not found");
  }
  return order;
};

export const updateOrderStatus = async (id, status) => {
  const order = await Order.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true, runValidators: true }
  ).populate("service");

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

export const addRating = async (id, rating, ratingComment, userId) => {
  const order = await Order.findOneAndUpdate(
    { _id: id, createdBy: userId },
    { $set: { rating, ratingComment } },
    { new: true, runValidators: true }
  ).populate("service");

  if (!order) {
    throw new Error("Order not found or you are not allowed to rate it");
  }

  return order;
};

export const verifyAdminPhoneLast4 = async (id, last4, userId) => {
  if (!last4 || String(last4).length !== 4) {
    throw new Error("last4 must be 4 digits");
  }

  const order = await Order.findById(id).populate("provider");

  if (!order) {
    throw new Error("Order not found");
  }

  if (!order.createdBy || order.createdBy.toString() !== String(userId)) {
    throw new Error("You are not allowed to verify this order");
  }

  if (!order.provider) {
    throw new Error("Admin not found for this order");
  }

  const provider = order.provider;
  const adminLast4 =
    provider.phoneLast4 ||
    (provider.phone ? String(provider.phone).slice(-4) : null);

  if (!adminLast4 || adminLast4 !== String(last4)) {
    throw new Error("Admin phone verification failed");
  }

  await Order.findByIdAndUpdate(id, { $set: { status: "processing" } });

  return {
    ok: true,
    adminId: order.provider._id,
  };
};


