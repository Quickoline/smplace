import { ServiceCategory } from "../model/model.js";
import { Service } from "../../model/model.js";
import {
  canManageCatalog,
  canManageOrders,
  isSuperadmin,
} from "../../../../auth/roles.js";

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
    update.subcategories = subcategories.map((n) =>
      typeof n === "string" ? { name: n } : { name: n?.name ?? n }
    );
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

/**
 * Admin tree: categories with nested subcategories and services (by categoryId / subcategoryId).
 */
export const listAdminCategoriesWithServices = async (adminId, role) => {
  let serviceFilter;
  if (isSuperadmin(role)) {
    serviceFilter = {};
  } else if (canManageCatalog(role)) {
    serviceFilter = { createdBy: adminId };
  } else if (canManageOrders(role)) {
    serviceFilter = {
      $or: [{ createdBy: adminId }, { operationsAdminId: adminId }],
    };
  } else {
    return [];
  }

  const services = await Service.find(serviceFilter)
    .populate("categoryId")
    .sort({ createdAt: -1 })
    .lean();

  const byCat = new Map();

  for (const svc of services) {
    const cat = svc.categoryId;
    if (!cat || !cat._id) continue;

    const catId = String(cat._id);
    if (!byCat.has(catId)) {
      byCat.set(catId, {
        categoryId: catId,
        name: cat.name,
        subMap: new Map(),
      });
    }
    const bucket = byCat.get(catId);

    const subIdRaw = svc.subcategoryId ? String(svc.subcategoryId) : "";
    const subDoc = subIdRaw
      ? (cat.subcategories || []).find((s) => String(s._id) === subIdRaw)
      : null;
    const subKey = subIdRaw || "_none";
    const subName = subDoc?.name || (subIdRaw ? "Subcategory" : "General");

    if (!bucket.subMap.has(subKey)) {
      bucket.subMap.set(subKey, {
        subcategoryId: subIdRaw || null,
        name: subName,
        services: [],
      });
    }

    bucket.subMap.get(subKey).services.push({
      id: String(svc._id),
      name: svc.name,
      description: svc.description,
      price: svc.price,
    });
  }

  return [...byCat.values()].map((b) => ({
    categoryId: b.categoryId,
    name: b.name,
    subcategories: [...b.subMap.values()],
  }));
};
