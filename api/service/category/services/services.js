import { ServiceCategory } from "../model/model.js";
import { Service } from "../../model/model.js";

export const createCategory = async ({ name, subcategories }) => {
  if (!name) {
    throw new Error("name is required");
  }

  const existing = await ServiceCategory.findOne({ name });
  if (existing) {
    throw new Error("Category with this name already exists");
  }

  const doc = await ServiceCategory.create({
    name,
    subcategories: Array.isArray(subcategories)
      ? subcategories.map((n) => ({ name: n }))
      : [],
  });

  return doc;
};

export const listCategories = async () => {
  return ServiceCategory.find().sort({ createdAt: 1 });
};

export const getCategoryById = async (id) => {
  const cat = await ServiceCategory.findById(id);
  if (!cat) {
    throw new Error("Category not found");
  }
  return cat;
};

export const updateCategory = async (id, { name, subcategories }) => {
  const update = {};
  if (name) update.name = name;
  if (Array.isArray(subcategories)) {
    update.subcategories = subcategories.map((n) => ({ name: n }));
  }

  const cat = await ServiceCategory.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!cat) {
    throw new Error("Category not found");
  }

  return cat;
};

export const deleteCategory = async (id) => {
  const cat = await ServiceCategory.findByIdAndDelete(id);
  if (!cat) {
    throw new Error("Category not found");
  }
  return cat;
};

export const addSubcategory = async (id, subcategoryName) => {
  if (!subcategoryName) {
    throw new Error("subcategory name is required");
  }

  const cat = await ServiceCategory.findByIdAndUpdate(
    id,
    { $addToSet: { subcategories: { name: subcategoryName } } },
    { new: true }
  );

  if (!cat) {
    throw new Error("Category not found");
  }

  return cat;
};

export const removeSubcategory = async (id, subcategoryId) => {
  const cat = await ServiceCategory.findByIdAndUpdate(
    id,
    { $pull: { subcategories: { _id: subcategoryId } } },
    { new: true }
  );

  if (!cat) {
    throw new Error("Category not found");
  }

  return cat;
};

export const listAdminCategoriesWithServices = async (adminId) => {
  // Services created by this admin
  const services = await Service.find({ createdBy: adminId });

  // Group by category + subcategory
  const result = {};

  services.forEach((svc) => {
    const catName = svc.category || "uncategorized";
    const subName = svc.subcategory || "default";

    if (!result[catName]) {
      result[catName] = {};
    }
    if (!result[catName][subName]) {
      result[catName][subName] = [];
    }

    result[catName][subName].push({
      id: svc._id,
      name: svc.name,
      description: svc.description,
      price: svc.price,
    });
  });

  return result;
};

