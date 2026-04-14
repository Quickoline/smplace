import mongoose from "mongoose";

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    service: {
      // referenced document (Service or BuySellListing)
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "serviceModel",
    },
    serviceModel: {
      // which collection to populate from
      type: String,
      required: true,
      enum: ["Service", "BuySellListing"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "payment_verified",
        "task_completed",
        "final_payment_verified",
        "cancelled",
        "refund_requested",
        "refund_completed",
      ],
      default: "pending",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    ratingComment: {
      type: String,
      trim: true,
    },
    /** Partner's rating of the customer (this order). */
    customerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    customerRatingComment: {
      type: String,
      trim: true,
    },
    provider: {
      // handling admin (set when staff accepts the order, or legacy data)
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    listingOwner: {
      // listing creator (service / buy-sell); set at order creation
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);

