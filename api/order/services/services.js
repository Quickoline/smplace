import mongoose from "mongoose";
import { Order } from "../model/model.js";
import { Service } from "../../service/model/model.js";
import { BuySellListing } from "../../buySell/model/model.js";
import { User } from "../../../auth/model/model.js";

const providerSelect =
  "email name phone ratingAverage ratingCount clientRatingAverage clientRatingCount role employeeId phoneLast4";

export async function recomputeAdminRating(adminId) {
  if (!adminId) return;
  const id = adminId._id ? adminId._id : adminId;
  const agg = await Order.aggregate([
    {
      $match: {
        provider: new mongoose.Types.ObjectId(String(id)),
        rating: { $nin: [null, undefined] },
      },
    },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);
  const row = agg[0];
  if (!row) {
    await User.findByIdAndUpdate(id, {
      $unset: { ratingAverage: 1 },
      $set: { ratingCount: 0 },
    });
    return;
  }
  const avg = Math.round(row.avg * 10) / 10;
  await User.findByIdAndUpdate(id, {
    ratingAverage: avg,
    ratingCount: row.count,
  });
}

/** Aggregated partner→customer ratings (orders where this user is the customer). */
export async function recomputeCustomerRating(customerId) {
  if (!customerId) return;
  const id = customerId._id ? customerId._id : customerId;
  const agg = await Order.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(String(id)),
        customerRating: { $nin: [null, undefined] },
      },
    },
    {
      $group: {
        _id: null,
        avg: { $avg: "$customerRating" },
        count: { $sum: 1 },
      },
    },
  ]);
  const row = agg[0];
  if (!row) {
    await User.findByIdAndUpdate(id, {
      $unset: { clientRatingAverage: 1 },
      $set: { clientRatingCount: 0 },
    });
    return;
  }
  const avg = Math.round(row.avg * 10) / 10;
  await User.findByIdAndUpdate(id, {
    clientRatingAverage: avg,
    clientRatingCount: row.count,
  });
}

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

  const listingOwnerId = serviceDoc.createdBy || null;

  const order = await Order.create({
    customerName: user.email,
    phone: user.phone,
    service: serviceId,
    serviceModel,
    createdBy: userId,
    listingOwner: listingOwnerId,
    provider: null,
    status: "pending",
  });

  return Order.findById(order._id)
    .populate("service")
    .populate("listingOwner", providerSelect)
    .populate("provider", providerSelect);
};

export const listMyOrders = async (userId) => {
  return Order.find({ createdBy: userId })
    .sort({ createdAt: -1 })
    .populate("service")
    .populate("provider", providerSelect)
    .populate("listingOwner", providerSelect);
};

export const listAllOrders = async (userId, role) => {
  const filter =
    role === "superadmin"
      ? {}
      : {
          $or: [
            { provider: userId },
            { status: "pending", provider: null },
          ],
        };
  return Order.find(filter)
    .sort({ createdAt: -1 })
    .populate("service")
    .populate("provider", providerSelect)
    .populate("listingOwner", providerSelect);
};

export const getOrderById = async (id) => {
  const order = await Order.findById(id)
    .populate("service")
    .populate("provider", providerSelect)
    .populate("listingOwner", providerSelect)
    .populate("createdBy", providerSelect);
  if (!order) {
    throw new Error("Order not found");
  }
  return order;
};

/** Staff claims a pending order: sets provider and moves to processing (chat enabled). */
export const acceptOrder = async (id, actorId) => {
  const updated = await Order.findOneAndUpdate(
    {
      _id: id,
      status: "pending",
      provider: null,
    },
    { $set: { provider: actorId, status: "processing" } },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new Error(
      "Order could not be accepted. It may already be assigned or is not pending."
    );
  }

  return getOrderById(updated._id);
};

export const updateOrderStatus = async (id, status, actorId, role) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new Error("Order not found");
  }
  if (role !== "superadmin" && String(order.provider) !== String(actorId)) {
    throw new Error("Not allowed to update this order");
  }

  order.status = status;
  await order.save();
  return getOrderById(order._id);
};

export const addRating = async (id, rating, ratingComment, userId) => {
  const r = Number(rating);
  if (Number.isNaN(r) || r < 1 || r > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const order = await Order.findOneAndUpdate(
    { _id: id, createdBy: userId },
    {
      $set: {
        rating: r,
        ratingComment:
          ratingComment != null ? String(ratingComment).trim() : undefined,
      },
    },
    { new: true, runValidators: true }
  ).populate("service");

  if (!order) {
    throw new Error("Order not found or you are not allowed to rate it");
  }

  if (order.provider) {
    await recomputeAdminRating(order.provider);
  }

  return getOrderById(order._id);
};

export const addCustomerRatingByProvider = async (
  id,
  rating,
  ratingComment,
  actorId,
  role
) => {
  const r = Number(rating);
  if (Number.isNaN(r) || r < 1 || r > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new Error("Order not found");
  }
  if (role !== "superadmin" && String(order.provider) !== String(actorId)) {
    throw new Error("Not allowed to rate this customer");
  }
  if (!order.createdBy) {
    throw new Error("Customer not found on order");
  }
  if (order.status === "cancelled") {
    throw new Error("Cannot rate a cancelled order");
  }

  order.customerRating = r;
  order.customerRatingComment =
    ratingComment != null ? String(ratingComment).trim() : undefined;
  await order.save();

  await recomputeCustomerRating(order.createdBy);

  return getOrderById(order._id);
};

