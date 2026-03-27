import {
  createListing,
  listListings,
  getListingById,
  updateListing,
  deleteListing,
} from "../services/services.js";

export const createListingController = async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      price,
      serviceCategory,
      requirements,
    } = req.body;

    const listing = await createListing({
      title,
      type,
      description,
      price,
      serviceCategory,
      requirements,
      userId: req.user?.id,
    });

    res.status(201).json({ message: "Listing created", listing });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listListingsController = async (req, res) => {
  try {
    const listings = await listListings();
    res.status(200).json({ listings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getListingController = async (req, res) => {
  try {
    const listing = await getListingById(req.params.id);
    res.status(200).json({ listing });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateListingController = async (req, res) => {
  try {
    const listing = await updateListing(req.params.id, req.body);
    res.status(200).json({ message: "Listing updated", listing });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteListingController = async (req, res) => {
  try {
    await deleteListing(req.params.id);
    res.status(200).json({ message: "Listing deleted" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

