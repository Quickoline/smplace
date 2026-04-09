import { createContactSubmission } from "../services/services.js";

export const createContactController = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const userId = req.user?.id;
    const submission = await createContactSubmission({
      name,
      email,
      subject,
      message,
      userId,
    });
    res.status(201).json({
      message: "Thank you — we received your message and will get back to you soon.",
      id: submission._id,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
