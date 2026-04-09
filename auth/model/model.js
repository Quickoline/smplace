import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
    },
    employeeId: {
      type: String,
    },
    phoneLast4: {
      type: String,
      trim: true,
      maxlength: 4,
    },
    qrCodeUrl: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: [
        "user",
        "admin",
        "senior_admin",
        "service_admin",
        "superadmin",
      ],
      required: true,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
