import {
  createOnboardingRequest,
  listOnboardingRequests,
} from "../services/services.js";

export const createOnboardingController = async (req, res) => {
  try {
    const {
      businessName,
      yourName,
      phone,
      workEmail,
      primaryCategoryFocus,
      servicesPlanned,
      portfolioUrl,
      notes,
    } = req.body;
    const userId = req.user?.id;
    const doc = await createOnboardingRequest({
      businessName,
      yourName,
      phone,
      workEmail,
      primaryCategoryFocus,
      servicesPlanned,
      portfolioUrl,
      notes,
      userId,
    });
    res.status(201).json({
      message: "Thanks — we received your request and will review it shortly.",
      id: doc._id,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listOnboardingController = async (req, res) => {
  try {
    const items = await listOnboardingRequests();
    res.status(200).json({ onboardingRequests: items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
