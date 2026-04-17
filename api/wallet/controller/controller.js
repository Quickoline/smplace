import {
  getWalletTransactions,
  getWalletSummary,
  applyManualWalletAdjustment,
} from "../services/services.js";

export const getWalletController = async (req, res) => {
  try {
    const transactions = await getWalletTransactions(req.user.id);
    const summary = await getWalletSummary(req.user.id);
    res.status(200).json({
      transactions,
      summary: {
        totalPaid: summary.totalPaid,
        transactionCount: summary.transactionCount,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/** Superadmin — body: { userId?, email?, amount, note? } — signed INR delta. */
export const manualWalletAdjustmentController = async (req, res) => {
  try {
    const { userId, email, amount, note } = req.body ?? {};
    const transaction = await applyManualWalletAdjustment({
      targetUserId: userId,
      targetEmail: email,
      amount,
      note,
      staffUserId: req.user.id,
    });
    res.status(201).json({
      message: "Wallet updated",
      transaction,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
