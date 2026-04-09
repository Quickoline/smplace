import mongoose from "mongoose";

const { Schema } = mongoose;

const contactSubmissionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 8000 },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const ContactSubmission = mongoose.model(
  "ContactSubmission",
  contactSubmissionSchema
);
