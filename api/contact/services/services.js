import { signMediaUrlIfNeeded } from "../../../config/aws.js";
import { ContactSubmission } from "../model/model.js";

/**
 * Relative `/uploads/...` URLs need an absolute origin for clients (mobile app / browser).
 * Prefer PUBLIC_API_URL (e.g. https://api.elizble.com) when the API sits behind a proxy.
 */
function resolveAttachmentUrl(url, req) {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = (process.env.PUBLIC_API_URL || "").replace(/\/$/, "");
  const origin =
    base || `${req.protocol}://${req.get("host") || "localhost"}`;
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

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

export const listContactSubmissions = async () => {
  return ContactSubmission.find()
    .sort({ createdAt: -1 })
    .lean();
};

/** Superadmin list: absolute URLs + presigned S3 GET URLs (private ACL). */
export const listContactSubmissionsForAdmin = async (req) => {
  const items = await listContactSubmissions();
  return Promise.all(
    items.map(async (doc) => {
      const attachments = await Promise.all(
        (doc.attachments || []).map(async (a) => {
          const resolved = resolveAttachmentUrl(a.url, req);
          const url = await signMediaUrlIfNeeded(resolved);
          return { ...a, url };
        })
      );
      return { ...doc, attachments };
    })
  );
};
