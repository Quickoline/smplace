import mongoose from "mongoose";

const { Schema } = mongoose;

const subcategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const serviceCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    subcategories: [subcategorySchema],
  },
  { timestamps: true }
);

export const ServiceCategory = mongoose.model(
  "ServiceCategory",
  serviceCategorySchema
);

