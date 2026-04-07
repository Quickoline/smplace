import { BuySellListing } from "../model/model.js";

export const createListing = async ({
  title,
  type,
  description,
  price,
  serviceCategory,
  requirements,
  operationsAdminId,
  userId,
}) => {
  if (!title || !type || !description || price == null) {
    throw new Error("title, type, description and price are required");
  }

  const listing = await BuySellListing.create({
    title,
    type,
    description,
    price,
    serviceCategory,
    requirements,
    operationsAdminId: operationsAdminId || undefined,
    createdBy: userId,
  });

  return listing;
};

export const listListings = async () => {
  return BuySellListing.find().sort({ createdAt: -1 });
};

export const getListingById = async (id) => {
  const listing = await BuySellListing.findById(id);
  if (!listing) {
    throw new Error("Listing not found");
  }
  return listing;
};

export const updateListing = async (id, payload) => {
  const listing = await BuySellListing.findByIdAndUpdate(
    id,
    {
      $set: {
        title: payload.title,
        type: payload.type,
        description: payload.description,
        price: payload.price,
        serviceCategory: payload.serviceCategory,
        requirements: payload.requirements,
        status: payload.status,
        ...(payload.operationsAdminId !== undefined
          ? { operationsAdminId: payload.operationsAdminId || null }
          : {}),
      },
    },
    { new: true, runValidators: true }
  );

  if (!listing) {
    throw new Error("Listing not found");
  }

  return listing;
};

export const deleteListing = async (id) => {
  const listing = await BuySellListing.findByIdAndDelete(id);
  if (!listing) {
    throw new Error("Listing not found");
  }
  return listing;
};

