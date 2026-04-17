import mongoose from "mongoose";
import { User } from "../../../auth/model/model.js";
import { WalletTransaction } from "../model/model.js";

const COMPLETED_STATUSES = ["task_completed", "final_payment_verified"];

export const getWalletTransactions = async (userId) => {
  const transactions = await WalletTransaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate("order", "status")
    .populate("payment", "amount type")
    .populate("createdByStaff", "email name");

  return transactions.filter((t) => {
    if (t.type === "manual_adjustment") return true;
    const status = t.order?.status ?? t.order;
    return !COMPLETED_STATUSES.includes(status);
  });
};

export const getWalletSummary = async (userId) => {
  const transactions = await getWalletTransactions(userId);
  const balance = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  return {
    totalPaid: balance,
    transactionCount: transactions.length,
  };
};

/**
 * Superadmin: apply a signed amount to a marketplace user's wallet (INR).
 * Positive adds credit; negative subtracts.
 * Pass either `targetUserId` or `targetEmail` (customer `role: user`).
 */
export const applyManualWalletAdjustment = async ({
  targetUserId,
  targetEmail,
  amount,
  note,
  staffUserId,
}) => {
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt === 0) {
    throw new Error("amount must be a non-zero number");
  }
  if (Math.abs(amt) > 1e9) {
    throw new Error("amount out of range");
  }

  const emailRaw = targetEmail != null ? String(targetEmail).trim().toLowerCase() : "";
  const idRaw = targetUserId != null ? String(targetUserId).trim() : "";

  let user = null;
  if (emailRaw) {
    user = await User.findOne({ email: emailRaw, role: "user" }).lean();
  } else if (idRaw) {
    if (!mongoose.Types.ObjectId.isValid(idRaw)) {
      throw new Error("Invalid user id");
    }
    user = await User.findById(idRaw).lean();
  } else {
    throw new Error("Provide userId or email");
  }

  if (!user || user.role !== "user") {
    throw new Error("User not found or not a customer account");
  }

  const uid = user._id.toString();
  const noteStr = note != null ? String(note).trim().slice(0, 500) : "";

  const doc = await WalletTransaction.create({
    user: uid,
    amount: amt,
    type: "manual_adjustment",
    ...(noteStr ? { note: noteStr } : {}),
    createdByStaff: staffUserId,
  });

  const populated = await WalletTransaction.findById(doc._id)
    .populate("createdByStaff", "email name")
    .lean();

  return populated;
};
