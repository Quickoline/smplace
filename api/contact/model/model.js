import mongoose from "mongoose";

const { Schema } = mongoose;

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    contentType: { type: String, trim: true },
    originalName: { type: String, trim: true },
  },
  { _id: false }
);

const contactSubmissionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 8000 },
    attachments: { type: [attachmentSchema], default: [] },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const ContactSubmission = mongoose.model(
  "ContactSubmission",
  contactSubmissionSchema
);
