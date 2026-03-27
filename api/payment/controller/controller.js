import {
  createPaymentRequest,
  getPaymentByOrder,
  listPaymentsByOrder,
  verifyPayment,
} from "../services/services.js";

export const createPaymentController = async (req, res) => {
  try {
    const { orderId, amount, type } = req.body;
    const result = await createPaymentRequest({
      orderId,
      amount: Number(amount),
      type,
      adminId: req.user.id,
    });
    res.status(201).json({
      message: "Payment request created",
      ...result,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getPaymentController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await getPaymentByOrder(
      orderId,
      req.user.id,
      req.user.role
    );
    if (!payment) {
      return res.status(404).json({ message: "No payment found for this order" });
    }
    res.status(200).json({ payment });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listPaymentsController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payments = await listPaymentsByOrder(
      orderId,
      req.user.id,
      req.user.role
    );
    res.status(200).json({ payments });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyPaymentController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await verifyPayment(id, req.user.id);
    res.status(200).json({
      message: "Payment verified. Amount added to user wallet.",
      payment: result.payment,
      order: result.order,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
