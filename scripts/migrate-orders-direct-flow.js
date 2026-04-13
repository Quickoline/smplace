/**
 * One-time: move legacy orders stuck in "pending" with a provider to "processing"
 * so chat/payment work without phone verification (direct order flow).
 *
 * Run from Backend: node scripts/migrate-orders-direct-flow.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Order } from "../api/order/model/model.js";

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGO_URI or MONGODB_URI in .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const res = await Order.updateMany(
    {
      status: "pending",
      provider: { $exists: true, $ne: null },
    },
    { $set: { status: "processing" } }
  );
  console.log("Updated orders:", res.modifiedCount);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
