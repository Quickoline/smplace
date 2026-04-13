import { ProviderOnboarding } from "../model/model.js";

export const createOnboardingRequest = async ({
  businessName,
  yourName,
  phone,
  workEmail,
  primaryCategoryFocus,
  servicesPlanned,
  portfolioUrl,
  notes,
  userId,
}) => {
  const n = String(businessName || "").trim();
  const yn = String(yourName || "").trim();
  const e = String(workEmail || "").trim().toLowerCase();
  const sp = String(servicesPlanned || "").trim();

  if (!n) throw new Error("Business or brand name is required");
  if (!yn) throw new Error("Your name is required");
  if (!e || !e.includes("@")) throw new Error("A valid work email is required");
  if (!primaryCategoryFocus) throw new Error("Primary category focus is required");
  if (sp.length < 10) throw new Error("Describe your planned services (at least 10 characters)");

  return ProviderOnboarding.create({
    businessName: n,
    yourName: yn,
    phone: phone != null ? String(phone).trim() : undefined,
    workEmail: e,
    primaryCategoryFocus,
    servicesPlanned: sp,
    portfolioUrl: portfolioUrl != null ? String(portfolioUrl).trim() : undefined,
    notes: notes != null ? String(notes).trim() : undefined,
    userId: userId || undefined,
  });
};

export const listOnboardingRequests = async () => {
  return ProviderOnboarding.find().sort({ createdAt: -1 }).lean();
};
