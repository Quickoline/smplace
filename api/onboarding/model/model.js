import mongoose from "mongoose";

const { Schema } = mongoose;

/** Provider onboarding — "Become a provider" form (website / app). */
const providerOnboardingSchema = new Schema(
  {
    businessName: { type: String, required: true, trim: true, maxlength: 200 },
    yourName: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, trim: true },
    workEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    primaryCategoryFocus: {
      type: String,
      required: true,
      enum: [
        "software_product",
        "legal_compliance",
        "design_brand",
        "hiring_leadership",
        "consulting",
        "buy_sell_advisory",
        "other_multiple",
      ],
    },
    servicesPlanned: { type: String, required: true, trim: true, maxlength: 12000 },
    portfolioUrl: { type: String, trim: true, maxlength: 2000 },
    notes: { type: String, trim: true, maxlength: 12000 },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const ProviderOnboarding = mongoose.model(
  "ProviderOnboarding",
  providerOnboardingSchema
);
