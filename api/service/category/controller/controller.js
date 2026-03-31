import {
  createCategory,
  listCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  addSubcategory,
  removeSubcategory,
  listAdminCategoriesWithServices,
} from "../services/services.js";

export const createCategoryController = async (req, res) => {
  try {
    const { name, subcategories } = req.body;
    const cat = await createCategory({ name, subcategories });
    res.status(201).json({ message: "Category created", category: cat });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listCategoriesController = async (req, res) => {
  try {
    const cats = await listCategories();
    res.status(200).json({ categories: cats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategoryController = async (req, res) => {
  try {
    const cat = await getCategoryById(req.params.id);
    res.status(200).json({ category: cat });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateCategoryController = async (req, res) => {
  try {
    const { name, subcategories } = req.body;
    const cat = await updateCategory(req.params.id, { name, subcategories });
    res.status(200).json({ message: "Category updated", category: cat });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCategoryController = async (req, res) => {
  try {
    await deleteCategory(req.params.id);
    res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const addSubcategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    const cat = await addSubcategory(req.params.id, name);
    res.status(200).json({ message: "Subcategory added", category: cat });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeSubcategoryController = async (req, res) => {
  try {
    const cat = await removeSubcategory(req.params.id, req.params.subId);
    res.status(200).json({ message: "Subcategory removed", category: cat });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const adminCategoriesWithServicesController = async (req, res) => {
  try {
    const adminId = req.user.id;
    const categories = await listAdminCategoriesWithServices(adminId);
    res.status(200).json({ categories });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

