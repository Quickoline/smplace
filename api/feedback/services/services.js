import { FeedbackSubmission } from "../model/model.js";

const TOPICS = new Set(["general", "service", "app", "other"]);

export const createFeedbackSubmission = async ({
  name,
  email,
  message,
  rating,
  topic,
  userId,
}) => {
  const m = String(message || "").trim();
  if (m.length < 10) throw new Error("Feedback must be at least 10 characters");

  let r;
  if (rating === null || rating === undefined || rating === "") {
    r = undefined;
  } else {
    r = Number(rating);
    if (Number.isNaN(r) || r < 1 || r > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
  }

  const t = topic != null ? String(topic) : "general";
  if (!TOPICS.has(t)) {
    throw new Error("topic must be one of: general, service, app, other");
  }

  const n = name != null ? String(name).trim() : "";
  const e = email != null ? String(email).trim().toLowerCase() : "";
  if (e && !e.includes("@")) throw new Error("Invalid email");

  const doc = await FeedbackSubmission.create({
    name: n || undefined,
    email: e || undefined,
    message: m,
    rating: r,
    topic: t,
    userId: userId || undefined,
  });

  return doc;
};
