import Razorpay from "razorpay";
import { Payment } from "../model/model.js";
import { Order } from "../../order/model/model.js";
import { User } from "../../../auth/model/model.js";
import { isSuperadmin } from "../../../auth/roles.js";
import { WalletTransaction } from "../../wallet/model/model.js";

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

export const createPaymentRequest = async ({
  orderId,
  amount,
  type,
  adminId,
}) => {
  if (!orderId || !amount || amount <= 0 || !type) {
    throw new Error("orderId, amount and type (gst|non_gst) are required");
  }

  const order = await Order.findById(orderId).populate("provider");
  if (!order) throw new Error("Order not found");

  if (String(order.provider) !== String(adminId)) {
    throw new Error("You can only create payment for your own orders");
  }

  if (type === "gst") {
    const razorpay = getRazorpay();
    if (!razorpay) {
      throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
    }

    const orderRes = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `order_${orderId}`,
    });

    const baseUrl = process.env.BASE_URL || "https://api.elizble.com";
    const paymentLink = await razorpay.paymentLink.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      description: `Payment for order ${orderId}`,
      notify: { sms: false, email: false },
      callback_url: process.env.RAZORPAY_CALLBACK_URL || `${baseUrl}/payments/callback`,
      callback_method: "get",
    });

    const payment = await Payment.create({
      order: orderId,
      amount,
      type: "gst",
      razorpayOrderId: orderRes.id,
      razorpayPaymentLink: paymentLink.short_url,
      createdBy: adminId,
    });

    return {
      payment,
      paymentLink: paymentLink.short_url,
      qrCodeUrl: null,
      amount,
      type: "gst",
    };
  }

  if (type === "non_gst") {
    const admin = await User.findById(adminId);
    if (!admin || !admin.qrCodeUrl) {
      throw new Error("Admin QR code is required for non-GST payment. Upload during registration.");
    }

    const payment = await Payment.create({
      order: orderId,
      amount,
      type: "non_gst",
      createdBy: adminId,
    });

    return {
      payment,
      paymentLink: null,
      qrCodeUrl: admin.qrCodeUrl,
      amount,
      type: "non_gst",
    };
  }

  throw new Error("type must be gst or non_gst");
};

export const getPaymentByOrder = async (orderId, userId, role) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const isUser = order.createdBy && String(order.createdBy) === String(userId);
  const isAdmin = order.provider && String(order.provider) === String(userId);

  if (!isUser && !isAdmin && !isSuperadmin(role)) {
    throw new Error("Not allowed to view this payment");
  }

  const payment = await Payment.findOne({ order: orderId })
    .sort({ createdAt: -1 })
    .populate("createdBy", "email");

  if (!payment) {
    return null;
  }

  const result = payment.toObject();
  if (payment.type === "gst") {
    result.paymentLink = payment.razorpayPaymentLink || null;
    result.qrCodeUrl = null;
  } else {
    const admin = await User.findById(payment.createdBy?._id || payment.createdBy).select("qrCodeUrl");
    result.qrCodeUrl = admin?.qrCodeUrl || null;
    result.paymentLink = null;
  }
  return result;
};

export const listPaymentsByOrder = async (orderId, userId, role) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const isUser = order.createdBy && String(order.createdBy) === String(userId);
  const isAdmin = order.provider && String(order.provider) === String(userId);

  if (!isUser && !isAdmin && !isSuperadmin(role)) {
    throw new Error("Not allowed to view payments for this order");
  }

  return Payment.find({ order: orderId }).sort({ createdAt: -1 });
};

export const verifyPayment = async (paymentId, adminId, role) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error("Payment not found");

  const order = await Order.findById(payment.order);
  if (!order) throw new Error("Order not found");

  if (
    !isSuperadmin(role) &&
    String(order.provider) !== String(adminId)
  ) {
    throw new Error("Only the order provider can verify this payment");
  }

  if (payment.status === "paid") {
    throw new Error("Payment already verified");
  }

  if (order.status === "task_completed" || order.status === "final_payment_verified") {
    throw new Error("Order already completed");
  }

  payment.status = "paid";
  await payment.save();

  order.status = "payment_verified";
  await order.save();

  await WalletTransaction.create({
    user: order.createdBy,
    order: order._id,
    payment: payment._id,
    amount: payment.amount,
    type: "payment_verified",
  });

  return { payment, order };
};
