import {
  createService,
  listServices,
  getServiceById,
  updateService,
  deleteService,
} from "../services/services.js";

export const createServiceController = async (req, res) => {
  try {
    const { name, category, subcategory, description, price, requirements } =
      req.body;
    const service = await createService({
      name,
      category,
      subcategory,
      description,
      price,
      requirements,
      userId: req.user?.id,
    });
    res.status(201).json({ message: "Service created", service });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listServicesController = async (req, res) => {
  try {
    const services = await listServices();
    res.status(200).json({ services });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getServiceController = async (req, res) => {
  try {
    const service = await getServiceById(req.params.id);
    res.status(200).json({ service });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateServiceController = async (req, res) => {
  try {
    const service = await updateService(req.params.id, req.body);
    res.status(200).json({ message: "Service updated", service });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteServiceController = async (req, res) => {
  try {
    await deleteService(req.params.id);
    res.status(200).json({ message: "Service deleted" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
