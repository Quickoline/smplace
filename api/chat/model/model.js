import mongoose from "mongoose";

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      trim: true,
      default: "",
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    mediaType: {
      type: String,
      trim: true,
      enum: ["image", "video", "audio", "document", ""],
      default: "",
    },
    // optional: whether user/admin has read it
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

messageSchema.index({ order: 1, createdAt: 1 });

messageSchema.pre("validate", function (next) {
  const hasBody = this.body && String(this.body).trim().length > 0;
  const hasMedia = this.mediaUrl && String(this.mediaUrl).trim().length > 0;
  if (!hasBody && !hasMedia) {
    next(new Error("Either body or mediaUrl is required"));
  } else {
    next();
  }
});

export const Message = mongoose.model("Message", messageSchema);

