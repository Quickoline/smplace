import { Message } from "../model/model.js";
import { Order } from "../../order/model/model.js";
import { getIO } from "../../../realtime/socket.js";

const ensureParticipant = (order, userId) => {
  const isUser =
    order.createdBy && String(order.createdBy) === String(userId);
  const isAdmin =
    order.provider && String(order.provider) === String(userId);

  if (!isUser && !isAdmin) {
    throw new Error("You are not a participant in this order chat");
  }

  return { isUser, isAdmin };
};

const inferMediaType = (mimetype) => {
  if (!mimetype) return "";
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "document";
};

export const sendMessage = async ({
  orderId,
  from,
  body,
  mediaUrl,
  mediaType,
}) => {
  if (!orderId || !from) {
    throw new Error("orderId and from are required");
  }

  if (!body && !mediaUrl) {
    throw new Error("Either body or mediaUrl is required");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const { isUser, isAdmin } = ensureParticipant(order, from);

  const to = isUser ? order.provider : order.createdBy;

  const msg = await Message.create({
    order: orderId,
    from,
    to,
    body: body || "",
    mediaUrl: mediaUrl || undefined,
    mediaType: mediaType || (mediaUrl ? inferMediaType(null) : ""),
  });

  const populated = await Message.findById(msg._id)
    .populate("from", "email role")
    .populate("to", "email role")
    .orFail();

  const io = getIO();
  if (io) {
    io.to(`order:${orderId}`).emit("chat:message", populated);
  }

  return populated;
};

export const listMessages = async ({ orderId, userId }) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  ensureParticipant(order, userId);

  const messages = await Message.find({ order: orderId })
    .sort({ createdAt: 1 })
    .populate("from", "email role")
    .populate("to", "email role");

  return messages;
};

