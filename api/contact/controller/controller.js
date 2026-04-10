import { createContactSubmission } from "../services/services.js";
import { saveContactAttachment } from "../../../utils/mediaUpload.js";

export const createContactController = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const userId = req.user?.id;

    const attachments = [];
    const files = req.files;
    if (files && files.length) {
      for (const f of files) {
        const url = await saveContactAttachment({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
        });
        attachments.push({
          url,
          contentType: f.mimetype || "",
          originalName: f.originalname || "",
        });
      }
    }

    const submission = await createContactSubmission({
      name,
      email,
      subject,
      message,
      userId,
      attachments,
    });
    res.status(201).json({
      message: "Thank you — we received your message and will get back to you soon.",
      id: submission._id,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
