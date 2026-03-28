import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./auth/routes/routes.js";
import serviceRoutes from "./api/service/routes/routes.js";
import buySellRoutes from "./api/buySell/routes/routes.js";
import serviceCategoryRoutes from "./api/service/category/routes/routes.js";
import orderRoutes from "./api/order/routes/routes.js";
import chatRoutes from "./api/chat/routes/routes.js";
import paymentRoutes from "./api/payment/routes/routes.js";
import walletRoutes from "./api/wallet/routes/routes.js";
import { initSocket } from "./realtime/socket.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:65157",
  "http://127.0.0.1:65157",
  "http://localhost:65141",
  "http://127.0.0.1:65141",
  "https://elizble.com",
  "https://www.elizble.com",
  "https://elizble.in",
  "https://www.elizble.in",
  "https://smweb.elizble.com",
];
const extraOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOriginSet = new Set([...allowedOrigins, ...extraOrigins]);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOriginSet.has(origin)) return cb(null, true);
      if (origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:"))
        return cb(null, true);
      cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Service Marketplace Backend running" });
});

app.use("/auth", authRoutes);
app.use("/services", serviceRoutes);
app.use("/buy-sell", buySellRoutes);
app.use("/service-categories", serviceCategoryRoutes);
app.use("/orders", orderRoutes);
app.use("/chat", chatRoutes);
app.use("/payments", paymentRoutes);
app.use("/wallet", walletRoutes);

const start = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Server + Socket.io running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

start();
