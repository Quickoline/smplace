import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { User } from "./model/model.js";

const run = async () => {
  try {
    await connectDB();

    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in environment variables"
      );
    }

    const existing = await User.findOne({ email, role: "superadmin" });
    if (existing) {
      console.log("Superadmin already exists with this email");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      email,
      passwordHash,
      role: "superadmin",
    });

    console.log("Superadmin user created successfully");
  } catch (error) {
    console.error("Error creating superadmin:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();

