import mongoose from "mongoose";

const { Schema } = mongoose;

const buySellSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      // 'product' or 'company'
      type: String,
      required: true,
      enum: ["product", "company"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    serviceCategory: {
      // link to service-based domain
      type: String,
      enum: [
        "software",
        "legal",
        "design",
        "hiring",
        "consultancy",
        "buying_selling",
      ],
    },
    requirements: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["available", "under_offer", "sold"],
      default: "available",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    operationsAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const BuySellListing = mongoose.model("BuySellListing", buySellSchema);

