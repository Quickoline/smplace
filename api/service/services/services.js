import { Service } from "../model/model.js";

export const createService = async ({
  name,
  category,
  subcategory,
  description,
  price,
  requirements,
  userId,
}) => {
  if (!name || !category || !description || price == null) {
    throw new Error("name, category, description and price are required");
  }

  const service = await Service.create({
    name,
    category,
    subcategory,
    description,
    price,
    requirements,
    createdBy: userId,
  });

  return service;
};

export const listServices = async () => {
  return Service.find().sort({ createdAt: -1 });
};

export const getServiceById = async (id) => {
  const service = await Service.findById(id);
  if (!service) {
    throw new Error("Service not found");
  }
  return service;
};

export const updateService = async (id, payload) => {
  const service = await Service.findByIdAndUpdate(
    id,
    {
      $set: {
        name: payload.name,
        category: payload.category,
        subcategory: payload.subcategory,
        description: payload.description,
        price: payload.price,
        requirements: payload.requirements,
      },
    },
    { new: true, runValidators: true }
  );

  if (!service) {
    throw new Error("Service not found");
  }

  return service;
};

export const deleteService = async (id) => {
  const service = await Service.findByIdAndDelete(id);
  if (!service) {
    throw new Error("Service not found");
  }
  return service;
};
