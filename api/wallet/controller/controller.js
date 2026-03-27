import {
  getWalletTransactions,
  getWalletSummary,
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
