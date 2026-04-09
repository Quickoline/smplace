import { createFeedbackSubmission } from "../services/services.js";

export const createFeedbackController = async (req, res) => {
  try {
    const { name, email, message, rating, topic } = req.body;
    const userId = req.user?.id;
    const submission = await createFeedbackSubmission({
      name,
      email,
      message,
      rating,
      topic,
      userId,
    });
    res.status(201).json({
      message: "Thanks for your feedback — it helps us improve Elizble.",
      id: submission._id,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
