import { ContactSubmission } from "../model/model.js";

export const createContactSubmission = async ({
  name,
  email,
  subject,
  message,
  userId,
}) => {
  const n = String(name || "").trim();
  const e = String(email || "").trim().toLowerCase();
  const s = String(subject || "").trim();
  const m = String(message || "").trim();

  if (!n) throw new Error("Name is required");
  if (!e || !e.includes("@")) throw new Error("A valid email is required");
  if (!s) throw new Error("Subject is required");
  if (m.length < 10) throw new Error("Message must be at least 10 characters");

  const doc = await ContactSubmission.create({
    name: n,
    email: e,
    subject: s,
    message: m,
    userId: userId || undefined,
  });

  return doc;
};
