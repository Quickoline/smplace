import {
  createServiceRequest,
  listServiceRequestsForSuperadmin,
} from "../services/services.js";

export const createServiceRequestController = async (req, res) => {
  try {
    const { title, description } = req.body ?? {};
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const submission = await createServiceRequest({
      title,
      description,
      userId,
    });
    res.status(201).json({
      message:
        "Thanks — we received your request. Our team will review it soon.",
      id: submission._id,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listServiceRequestsController = async (req, res) => {
  try {
    const items = await listServiceRequestsForSuperadmin();
    res.status(200).json({ serviceRequests: items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
