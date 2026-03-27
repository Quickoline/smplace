import { Router } from "express";
import {
  sendMessageController,
  sendMediaMessageController,
  listMessagesController,
} from "../controller/controller.js";
import { authenticate } from "../../../auth/middleware/middleware.js";
import { uploadChatMedia } from "../../../utils/upload.js";

const router = Router();

// List messages in an order chat (user or admin, but must belong to that order)
router.get("/:orderId", authenticate, listMessagesController);

// Send text message
// body: { orderId, body }
router.post("/", authenticate, sendMessageController);

// Send media message (multipart: orderId, body?, mediaType?, file)
router.post(
  "/media",
  authenticate,
  uploadChatMedia.single("file"),
  sendMediaMessageController
);

export default router;

