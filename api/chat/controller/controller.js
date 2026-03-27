import { sendMessage, listMessages } from "../services/services.js";

export const sendMessageController = async (req, res) => {
  try {
    const { orderId, body, mediaUrl, mediaType } = req.body;
    const msg = await sendMessage({
      orderId,
      from: req.user.id,
      body,
      mediaUrl,
      mediaType,
    });
    res.status(201).json({ message: "Message sent", data: msg });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const sendMediaMessageController = async (req, res) => {
  try {
    const { orderId, body, mediaType } = req.body;
    const mediaUrl = req.file ? `/uploads/chat/${req.file.filename}` : null;

    if (!mediaUrl) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const msg = await sendMessage({
      orderId,
      from: req.user.id,
      body: body || "",
      mediaUrl,
      mediaType: mediaType || "",
    });
    res.status(201).json({ message: "Message sent", data: msg });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listMessagesController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const messages = await listMessages({
      orderId,
      userId: req.user.id,
    });
    res.status(200).json({ messages });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

