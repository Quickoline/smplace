import { Service } from "../model/model.js";

import { ServiceCategory } from "../category/model/model.js";



async function assertCategoryPair(categoryId, subcategoryId) {

  if (!categoryId) {

    throw new Error("categoryId is required");

  }

  const cat = await ServiceCategory.findById(categoryId);

  if (!cat) {

    throw new Error("Category not found");

  }

  if (subcategoryId) {

    const ok = (cat.subcategories || []).some(

      (s) => String(s._id) === String(subcategoryId)

    );

    if (!ok) {

      throw new Error("Subcategory does not belong to this category");

    }

  }

}



/** Plain object for API: ids + nested { _id, name } for labels (not stored on doc). */

export function serializeService(lean) {

  const catDoc =

    lean.categoryId &&

    typeof lean.categoryId === "object" &&

    lean.categoryId._id

      ? lean.categoryId

      : null;



  const categoryIdStr = catDoc

    ? String(catDoc._id)

    : lean.categoryId

      ? String(lean.categoryId)

      : null;



  let subcategory = null;

  if (lean.subcategoryId && catDoc?.subcategories?.length) {

    const s = catDoc.subcategories.find(

      (x) => String(x._id) === String(lean.subcategoryId)

    );

    if (s) {

      subcategory = { _id: String(s._id), name: s.name };

    }

  }



  return {

    _id: String(lean._id),

    name: lean.name,

    categoryId: categoryIdStr,

    subcategoryId: lean.subcategoryId

      ? String(lean.subcategoryId)

      : null,

    category:

      catDoc && categoryIdStr

        ? { _id: categoryIdStr, name: catDoc.name }

        : null,

    subcategory,

    description: lean.description,

    price: lean.price,

    requirements: lean.requirements,

    createdBy: lean.createdBy != null ? String(lean.createdBy) : null,

    operationsAdminId:
      lean.operationsAdminId != null
        ? String(lean.operationsAdminId)
        : null,

    createdAt: lean.createdAt,

    updatedAt: lean.updatedAt,

  };

}



export const createService = async ({

  name,

  categoryId,

  subcategoryId,

  description,

  price,

  requirements,

  operationsAdminId,

  userId,

}) => {

  if (!name || !categoryId || !description || price == null) {

    throw new Error("name, categoryId, description and price are required");

  }



  await assertCategoryPair(categoryId, subcategoryId);



  const doc = await Service.create({

    name,

    categoryId,

    subcategoryId: subcategoryId || undefined,

    description,

    price,

    requirements,

    createdBy: userId,

  });



  const populated = await Service.findById(doc._id).populate("categoryId").lean();

  return serializeService(populated);

};



export const listServices = async () => {

  const rows = await Service.find()

    .populate("categoryId")

    .sort({ createdAt: -1 })

    .lean();

  return rows.map(serializeService);

};



export const getServiceById = async (id) => {

  const row = await Service.findById(id).populate("categoryId").lean();

  if (!row) {

    throw new Error("Service not found");

  }

  return serializeService(row);

};

export const updateService = async (id, payload) => {

  if (payload.categoryId != null || payload.subcategoryId !== undefined) {

    const existing = await Service.findById(id);

    if (!existing) {

      throw new Error("Service not found");

    }

    const catId = payload.categoryId ?? existing.categoryId;

    const subId =

      payload.subcategoryId !== undefined

        ? payload.subcategoryId

        : existing.subcategoryId;

    await assertCategoryPair(catId, subId || null);

  }



  const $set = {};

  if (payload.name !== undefined) $set.name = payload.name;

  if (payload.categoryId !== undefined) $set.categoryId = payload.categoryId;

  if (payload.subcategoryId !== undefined) {

    $set.subcategoryId = payload.subcategoryId || null;

  }

  if (payload.description !== undefined) $set.description = payload.description;

  if (payload.price !== undefined) $set.price = payload.price;

  if (payload.requirements !== undefined) {

    $set.requirements = payload.requirements;

  }

  if (payload.operationsAdminId !== undefined) {

    $set.operationsAdminId = payload.operationsAdminId || null;

  }



  const updated = await Service.findByIdAndUpdate(

    id,

    { $set },

    { new: true, runValidators: true }

  );



  if (!updated) {

    throw new Error("Service not found");

  }



  const populated = await Service.findById(updated._id)

    .populate("categoryId")

    .lean();

  return serializeService(populated);

};



export const deleteService = async (id) => {

  const service = await Service.findByIdAndDelete(id);

  if (!service) {

    throw new Error("Service not found");

  }

  return service;

};

