import mongoose from "mongoose";

const { Schema } = mongoose;

const feedbackSubmissionSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 8000 },
    rating: { type: Number, min: 1, max: 5 },
    topic: {
      type: String,
      enum: ["general", "service", "app", "other"],
      default: "general",
    },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const FeedbackSubmission = mongoose.model(
  "FeedbackSubmission",
  feedbackSubmissionSchema
);
