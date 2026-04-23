import { ServiceRequest } from "../model/model.js";

export const createServiceRequest = async ({ title, description, userId }) => {
  const t = String(title || "").trim();
  const d = String(description || "").trim();
  if (t.length < 3) throw new Error("Title must be at least 3 characters");
  if (d.length < 20) {
    throw new Error("Description must be at least 20 characters");
  }

  const doc = await ServiceRequest.create({
    title: t,
    description: d,
    userId,
  });

  return doc;
};

export const listServiceRequestsForSuperadmin = async () => {
  return ServiceRequest.find()
    .sort({ createdAt: -1 })
    .populate("userId", "name email phone")
    .lean();
};
