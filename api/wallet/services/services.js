import { WalletTransaction } from "../model/model.js";

const COMPLETED_STATUSES = ["task_completed", "final_payment_verified"];

export const getWalletTransactions = async (userId) => {
  const transactions = await WalletTransaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate("order", "status")
    .populate("payment", "amount type");

  return transactions.filter((t) => {
    const status = t.order?.status ?? t.order;
    return !COMPLETED_STATUSES.includes(status);
  });
};

export const getWalletSummary = async (userId) => {
  const transactions = await getWalletTransactions(userId);
  const totalPaid = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  return {
    totalPaid,
    transactionCount: transactions.length,
  };
};
