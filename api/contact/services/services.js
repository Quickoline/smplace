import { ContactSubmission } from "../model/model.js";

export const createContactSubmission = async ({
  name,
  email,
  subject,
  message,
  userId,
  attachments = [],
}) => {
  const n = String(name || "").trim();
  const e = String(email || "").trim().toLowerCase();
  const s = String(subject || "").trim();
  const m = String(message || "").trim();

  if (!n) throw new Error("Name is required");
  if (!e || !e.includes("@")) throw new Error("A valid email is required");
  if (!s) throw new Error("Subject is required");
  const hasFiles = Array.isArray(attachments) && attachments.length > 0;
  if (!hasFiles && m.length < 10) {
    throw new Error("Message must be at least 10 characters, or attach a file");
  }
  if (hasFiles && m.length < 1) {
    throw new Error("Add a short message with your attachments");
  }

  const doc = await ContactSubmission.create({
    name: n,
    email: e,
    subject: s,
    message: m,
    attachments: hasFiles ? attachments : [],
    userId: userId || undefined,
  });

  return doc;
};
