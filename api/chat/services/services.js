import { Message } from "../model/model.js";
import { Order } from "../../order/model/model.js";
import { getIO } from "../../../realtime/socket.js";
import { signMediaUrlIfNeeded } from "../../../config/aws.js";

const STAFF_POPULATE_FIELDS =
  "email role name phone ratingAverage ratingCount employeeId phoneLast4";

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

export const inferMediaTypeFromMime = (mimetype) => {
  if (!mimetype) return "document";
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "document";
};

async function withSignedMediaUrl(doc) {
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  if (plain.mediaUrl) {
    plain.mediaUrl = await signMediaUrlIfNeeded(plain.mediaUrl);
  }
  return plain;
}

/** Marks inbound messages as read when the recipient opens the thread. */
export async function markOrderMessagesRead(orderId, readerUserId) {
  const now = new Date();
  const result = await Message.updateMany(
    {
      order: orderId,
      to: readerUserId,
      $or: [{ readAt: { $exists: false } }, { readAt: null }],
    },
    { $set: { readAt: now } }
  );

  const io = getIO();
  if (io && result.modifiedCount > 0) {
    io.to(`order:${orderId}`).emit("chat:read", {
      orderId: String(orderId),
      readerId: String(readerUserId),
      readAt: now.toISOString(),
    });
  }
}

export const sendMessage = async ({
  orderId,
  from,
  body,
  mediaUrl,
  mediaType,
  mimeType,
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

  const isCustomer =
    order.createdBy && String(order.createdBy) === String(from);
  if (isCustomer && !order.provider) {
    throw new Error(
      "Chat is available after an admin accepts your order on the dashboard."
    );
  }

  const { isUser, isAdmin } = ensureParticipant(order, from);

  const to = isUser ? order.provider : order.createdBy;

  const resolvedMediaType =
    mediaType ||
    (mediaUrl && mimeType ? inferMediaTypeFromMime(mimeType) : "") ||
    (mediaUrl ? "document" : "");

  const msg = await Message.create({
    order: orderId,
    from,
    to,
    body: body || "",
    mediaUrl: mediaUrl || undefined,
    mediaType: resolvedMediaType,
  });

  const populated = await Message.findById(msg._id)
    .populate("from", STAFF_POPULATE_FIELDS)
    .populate("to", STAFF_POPULATE_FIELDS)
    .orFail();

  const io = getIO();
  if (io) {
    const payload = await withSignedMediaUrl(populated);
    io.to(`order:${orderId}`).emit("chat:message", payload);
  }

  return withSignedMediaUrl(populated);
};

export const listMessages = async ({ orderId, userId }) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const isCustomer =
    order.createdBy && String(order.createdBy) === String(userId);
  if (isCustomer && !order.provider) {
    throw new Error(
      "Chat is available after an admin accepts your order on the dashboard."
    );
  }

  ensureParticipant(order, userId);

  await markOrderMessagesRead(orderId, userId);

  const messages = await Message.find({ order: orderId })
    .sort({ createdAt: 1 })
    .populate("from", STAFF_POPULATE_FIELDS)
    .populate("to", STAFF_POPULATE_FIELDS);

  const out = [];
  for (const m of messages) {
    out.push(await withSignedMediaUrl(m));
  }
  return out;
};

