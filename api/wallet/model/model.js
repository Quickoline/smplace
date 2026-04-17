import mongoose from "mongoose";

const { Schema } = mongoose;

const walletTransactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    /** For payment_verified: positive (INR). For manual_adjustment: signed delta (credit + / debit -). */
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["payment_verified", "manual_adjustment"],
      default: "payment_verified",
    },
    /** Superadmin note for manual_adjustment only. */
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    /** Staff user who created a manual adjustment. */
    createdByStaff: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });

export const WalletTransaction = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);
