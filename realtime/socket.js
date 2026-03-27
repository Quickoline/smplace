import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let ioInstance;

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const raw = token.startsWith("Bearer ") ? token.slice(7) : token;

    try {
      const decoded = jwt.verify(
        raw,
        process.env.JWT_SECRET || "change_me_in_production"
      );
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // Client should emit "joinOrder" with { orderId }
    socket.on("joinOrder", ({ orderId }) => {
      if (!orderId) return;
      socket.join(`order:${orderId}`);
    });

    socket.on("leaveOrder", ({ orderId }) => {
      if (!orderId) return;
      socket.leave(`order:${orderId}`);
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => ioInstance;

